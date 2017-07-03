/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Moderates messages by lowering all uppercase messages and removing swearwords.
exports.moderator = functions.database
    .ref('/user-status/0/{statusId}').onWrite(event => {
      const collectionRef = event.data.ref.parent;
      
      const message = event.data.val();
      const userId = 0
      console.log("exec test " + message.status)
      var ref = null
      var newValue = false
      var shouldSet = true
      
      if(typeof message.status == "undefined"){
        shouldSet = false
        console.log("should not set")
      }else if(message.status == 0){
        console.log("finished work ")
        newValue = false
        processStatus(null, null)
      }
      else{
        console.log("carry on")
        newValue = true
      }
      admin.database().ref('current-task/' + userId + "/").set(message);
      
});

function processStatus(req, res) {
  var ref = admin.database().ref('/user-status/0/')
  var isWorking = false;
  var tasks = []
  var currentTask = null
  var currentStatus = 0
  ref.once("value", (data) => {
    data.forEach(function(childSnapshot) {
      var childData = childSnapshot.val();
      if(isWorking == false && childData.status != 0)
      {
        currentStatus = childData.status;
        isWorking = true;
        currentTask = {}
        currentTask.entries = []
        currentTask.entries.push(childData);
        tasks.push(currentTask)
      }
      else if(isWorking == true && childData.status == 0){
        isWorking = false;
        currentTask = null
      }
      else if(isWorking == true && childData.status != 0){
        if(currentStatus != childData.status){
          currentTask.entries.push(childData)
          currentStatus = childData.status;
          isWorking = true;
          currentTask = {}
          currentTask.entries = []
          currentTask.entries.push(childData);
          tasks.push(currentTask)
        }else{
          currentTask.entries.push(childData)
        }
        
      }
      console.log("data " + childData.status + " :  " + childData.timestamp)
      admin.database().ref('user-status-archived/0/').push(childData);
    });

    console.log("try to remove")
    ref.remove()
    var userId = 0
    console.log("try to remove post`")
    
    tasks.map((data)=>{
      console.log("data start " + data.entries[0].timestamp)
      console.log("data start " + data.entries[data.entries.length - 1].timestamp)
      if(typeof data.entries[0].timestamp == "undefined"){
        return data
      }
      if(data.entries[0].timestamp == undefined){
        return data
      }
      if(data.entries[data.entries.length - 1].timestamp == undefined){
        return data
      }
      data.startTime = data.entries[0].timestamp
      data.endTime = data.entries[data.entries.length - 1].timestamp
      if(typeof data.entries[0].timestamp == "undefined"){
        data.endTime = data.startTime
      }
      if(data.entries[0] == null)
      {
          return data
      }
      data.status = data.entries[0].status
      data.duration = 0
      data.duration = data.endTime - data.startTime;
      data.productivity = 0
      data.meaningfulness = 0

      var timestamp = data.endTime;
      var date = new Date(timestamp);
      data.endTime = date.getHours() + ":" + date.getMinutes()
      var timestamp = data.startTime;
      var date = new Date(timestamp);
      data.startTime = date.getHours() + ":" + date.getMinutes()
      delete data.entries
      console.log("try to push")
      for (var key in data) {
          if (data.hasOwnProperty(key)) {
              console.log("ssavving " + key + " :  " + data[key])
          }
      }

      admin.database().ref('user-tasks/' + userId + "/").push(data);
      
      return data
    })
    admin.database().ref('/user-status/0/')
    // admin.database().ref('test-task/' + userId + "/").push(tasks);
    if(res){
      res.send("hello world")
    }
    
  })
  
}


exports.getData = functions.https.onRequest((req, res) => {
// [END addMessageTrigger]
  // Grab the text parameter.
  processStatus(req, res)
});



