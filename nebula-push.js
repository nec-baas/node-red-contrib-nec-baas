/**
 * NEC Mobile Backend Platform
 *
 * Copyright (c) 2014-2016 NEC Corporation
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
       
    function NebulaPushOutNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.name = config.name;
        this.func = config.func;
        
        var channelList = config.channels;
        var receiverList = config.receivers;
        var pushMessage = config.message;
        
        var isGCM = config.gcm;
        var isAPNS = config.apns;
        var isSSE = config.sse;
        
        var gcmTitle = config.gcmTitle;
        var gcmUri = config.gcmUri;
            
        var apnsBadge = config.apnsBadge;
        var apnsCategory = config.apnsCategory;
        var apnsSound = config.apnsSound;
            
        var sseEventId = config.sseEventId;
        var sseEventType = config.sseEventType;
        
        this.on('input', function(msg) {
            var Nebula = this.context().flow.get('Nebula');
                        
            try {         
                // Use the value of 'msg.message' if the 'msg.message' has the message.
                var message = msg.message ? msg.message : pushMessage;
                if (!message) {
                    throw RED._("nebula.errors.message-not-found"); 
                }
                
                var channels = msg.channels ? msg.channels : (channelList ? Common.csv2json(channelList) : []);
                var receivers = msg.receivers ? msg.receivers : (receiverList ? Common.csv2json(receiverList) : []);

                var push = new Nebula.PushSender();
                push.message = message;

                isGCM = msg.gcm ? (msg.gcm.enabled ? msg.gcm.enabled : isGCM) : isGCM;
                isAPNS = msg.apns ? (msg.apns.enabled ? msg.apns.enabled : isAPNS) : isAPNS;
                isSSE = msg.sse ? (msg.sse.enabled ? msg.sse.enabled : isSSE) : isSSE;
                
                if(isGCM) {
                    var gcm = new Nebula.PushSender.GcmFields();
                    gcm.title = msg.gcm ? (msg.gcm.title ? msg.gcm.title : gcmTitle) : gcmTitle;
                    gcm.uri = msg.gcm ? (msg.gcm.uri ? msg.gcm.uri : gcmUri) : gcmUri;
                    push.gcmFields = gcm;
                }

                if(isAPNS) {
                    apnsBadge = msg.apns ? (msg.apns.badge ? msg.apns.badge : apnsBadge): apnsBadge;
                    // Convert string to number.
                    var apnsBadgeNumber = RED.util.evaluateNodeProperty(apnsBadge, 'num', node, null);   
                    
                    var apns = new Nebula.PushSender.ApnsFields();
                    apns.badge = apnsBadgeNumber;
                    apns.sound = msg.apns ? (msg.apns.sound ? msg.apns.sound : apnsSound) : apnsSound;
                    apns.contentAvailable = 1;
                    apns.category = msg.apns ? (msg.apns.category ? msg.apns.category : apnsCategory) : apnsCategory;
                    push.apnsFields = apns;
                }

                if(isSSE) {
                    var sse = new Nebula.PushSender.SseFields();
                    sse.eventId = msg.sse ? (msg.sse.eventId ? msg.sse.eventId : sseEventId) : sseEventId;
                    sse.eventType = msg.sse ? (msg.sse.eventType ? msg.sse.eventType : sseEventType) : sseEventType;
                    push.sseFields = sse;
                }

                if (channels.length) {
                    push.clause = new Nebula.Clause({"_channels": {"$in": channels}});
                } else {
                    push.clause = new Nebula.Clause();
                }
                
                if (receivers.length) {
                    push.allowedReceivers = receivers;
                }
                //node.log("push clause: " + JSON.stringify(push));

                push.send()
                    .then(function(numInstallations) {
                        Common.sendMessage(node, "ok", numInstallations, msg);
                    })
                    .catch(function(error) {
                        Common.sendMessage(node, "failed", error, msg);
                    });
                
            } catch(err) {
                node.warn(err);
            }
        });
    }

    RED.nodes.registerType("push out", NebulaPushOutNode);
};

