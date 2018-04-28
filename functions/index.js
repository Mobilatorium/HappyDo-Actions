// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const firebase = require('firebase');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    
    function createTask(agent) {
        const parameters = request.body.queryResult.parameters;
        const text = parameters.text;
        if (text) {
            var docRef = db.collection('tasks').add({
                text: text,
                completed: false
            });
            agent.add(`"${text}" sounds like a nice task! Saved.`);
        } else {
            agent.add(`Sorry, I couldn't save task for you this time. Please try again later.`);
        }
    }
    
    function readAllTasks(agent) {
        return db.collection('tasks').get().then(snapshot => {
            agent.add(`Here is list of your tasks:`);
            var first = true;
            var tasksList = "";
            snapshot.forEach(task => {
                if (!first) {
                    tasksList += ", ";
                }
                tasksList += task.data().text;
                first = false;
            });
            agent.add(tasksList);
        }).catch(err => {
            agent.add(`Sorry, I cannot read your tasks this time. Please try again later.`);
            console.log(`readAllTasks err ${err}`);
        });
    }
    
    let intentMap = new Map();
    intentMap.set('Create task', createTask);
    intentMap.set('Read all tasks', readAllTasks)
    agent.handleRequest(intentMap);
});
