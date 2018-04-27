/**
 * NEC Mobile Backend Platform
 *
 * Copyright (c) 2014-2017 NEC Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function (RED) {
    "use strict";
    const Common = require('./nebula-common');
       
    const sendPush = function(push, node, msg) {
        push.send()
            .then(function(numInstallations) {
                Common.sendMessage(node, "ok", numInstallations, msg);
            })
            .catch(function(error) {
                Common.sendMessage(node, "failed", error, msg);
            });
    };
       
    function NebulaPushOutNode(config) {
        RED.nodes.createNode(this,config);
        
        this.gcmTitle = config.gcmTitle;
        this.gcmUri = config.gcmUri;
            
        this.apnsBadge = config.apnsBadge;
        this.apnsCategory = config.apnsCategory;
        this.apnsSound = config.apnsSound;
            
        this.sseEventId = config.sseEventId;
        this.sseEventType = config.sseEventType;
        
        const node = this;
        
        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula');
                        
            try {         
                // Use the value of 'msg.message' if the 'msg.message' has the message.
                const message = msg.hasOwnProperty('message') ? msg.message : config.message;
                if (!message) {
                    throw RED._("nebula.errors.message-not-found"); 
                }
                
                const channels = msg.hasOwnProperty('channels') ? msg.channels : (config.channels ? Common.csv2json(config.channels) : []);
                const receivers = msg.hasOwnProperty('receivers') ? msg.receivers : (config.receivers ? Common.csv2json(config.receivers) : []);

                const push = new nb.PushSender();
                push.message = message;

                node.isGCM = (msg.hasOwnProperty('gcm') && msg.gcm.hasOwnProperty('enabled')) ? msg.gcm.enabled : config.gcm;
                node.isAPNS = (msg.hasOwnProperty('apns') && msg.apns.hasOwnProperty('enabled')) ? msg.apns.enabled : config.apns;
                node.isSSE = (msg.hasOwnProperty('sse') && msg.sse.hasOwnProperty('enabled')) ? msg.sse.enabled : config.sse;
                
                if (node.isGCM) {
                    const gcm = new nb.PushSender.GcmFields();
                    gcm.title = (msg.hasOwnProperty('gcm') && msg.gcm.hasOwnProperty('title')) ? msg.gcm.title : config.gcmTitle;
                    gcm.uri = (msg.hasOwnProperty('gcm') && msg.gcm.hasOwnProperty('uri')) ? msg.gcm.uri : config.gcmUri;
                    push.gcmFields = gcm;
                }

                if (node.isAPNS) {
                    node.apnsBadge = (msg.hasOwnProperty('apns') && msg.apns.hasOwnProperty('badge')) ? msg.apns.badge : config.apnsBadge;
                    // Convert string to number.
                    const apnsBadgeNumber = RED.util.evaluateNodeProperty(node.apnsBadge, 'num', node, null);   
                    
                    const apns = new nb.PushSender.ApnsFields();
                    apns.badge = apnsBadgeNumber;
                    apns.sound = (msg.hasOwnProperty('apns') && msg.apns.hasOwnProperty('sound')) ? msg.apns.sound : config.apnsSound;
                    apns.contentAvailable = 1;
                    apns.category = (msg.hasOwnProperty('apns') && msg.apns.hasOwnProperty('category')) ? msg.apns.category : config.apnsCategory;
                    push.apnsFields = apns;
                }

                if (node.isSSE) {
                    const sse = new nb.PushSender.SseFields();
                    sse.eventId = (msg.hasOwnProperty('sse') && msg.sse.hasOwnProperty('eventId')) ? msg.sse.eventId : config.sseEventId;
                    sse.eventType = (msg.hasOwnProperty('sse') && msg.sse.hasOwnProperty('eventType')) ? msg.sse.eventType : config.sseEventType;
                    push.sseFields = sse;
                }

                if (channels.length) {
                    push.clause = new nb.Clause({"_channels": {"$in": channels}});
                } else {
                    push.clause = new nb.Clause();
                }
                
                if (receivers.length) {
                    push.allowedReceivers = receivers;
                }
                //node.log("push clause: " + JSON.stringify(push));

                sendPush(push, node, msg);
                
            } catch(err) {
                node.warn(err);
            }
        });
    }
    RED.nodes.registerType("push out", NebulaPushOutNode);
};

