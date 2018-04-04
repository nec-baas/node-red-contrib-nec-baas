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

    const MAX_BACKOFF_COUNT = 5;    
    const RETRY_INTERVAL = 2 * 1000; // msec.
    const MULTIPLIER = 5;
    
    const poll = function(nb, apiname, deviceId, deviceType) {       

        const api = new nb.CustomApi(
            apiname,
            "GET",
            "devices/" + deviceType + "/" + deviceId + "/event");

        api.setReceiveResponseHeaders(true);

        return new Promise((resolve, reject) => {
            api.execute()
                .then(function (result) {
                    resolve(result);
                }).catch(function (error) {
                    reject(error);
                });
        });
    };

    const report = function(nb, apiname, deviceId, deviceType, jsonReported) { 

        const api = new nb.CustomApi(
            apiname,
            "PUT",
            "devices/" + deviceType + "/" + deviceId + "/reported");

        api.setContentType("application/json");
        api.setReceiveResponseHeaders(true);

        return new Promise((resolve, reject) => {
            api.execute(jsonReported)
                .then(function (result) {
                    resolve(result);
                }).catch(function (error) {
                    reject(error);
                });
        });
    };
    
    const retry = function(node, msg) {
        let timerId = 0;
        
        if (node.backoffCount <  MAX_BACKOFF_COUNT) {
            node.backoffCount++;
            timerId = setTimeout( function() { node.emit("input", msg); }, node.retryInterval );
            //node.log("backoffCount:" + node.backoffCount + ", retryInterval:" + node.retryInterval/1000);
            node.retryInterval = node.retryInterval * MULTIPLIER; // Exponential backoff 
        } else {
            resetRetry(node, msg);
            node.warn(RED._("nebula.info.repeat-stopped"));
        }
        return timerId;
    };
    
    const resetRetry = function(node, msg) {
        node.backoffCount = 0;
        node.retryInterval = RETRY_INTERVAL;
        delete msg.retryCount;
    }
    
    const isNextCall = function(node) {
        clearTimeout(node.timerId);     
        node.isRunning = false;  
        return (!node.stopRepeat && node.isRepeat);
    }
    
    const setMessage = function(node) {
        const msg = {};
        msg.apiname = node.apiname;
        msg.isRepeat = node.isRepeat;
        msg.deviceId = node.deviceId;
        msg.deviceType = node.deviceType;
        return msg;
    }
    
    function NebulaDeviceInNode(config) {
        RED.nodes.createNode(this,config);

        this.apiname = config.apiname;
        this.isRepeat = config.isRepeat;
        this.deviceId = config.deviceId; 
        this.deviceType = config.deviceType;
        this.stopRepeat = false;
        this.timerId = 0;
        this.isRunning = false;
        this.backoffCount = 0;
        this.retryInterval = RETRY_INTERVAL;
        const node = this;
        
        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula');

            try {
                // Use the value of 'msg.xxx' if the 'msg.xxx' has the property.
                node.apiname = msg.hasOwnProperty('apiname') ? msg.apiname : config.apiname;
                node.isRepeat = msg.hasOwnProperty('isRepeat') ? msg.isRepeat : config.isRepeat;
                node.deviceId = msg.hasOwnProperty('deviceId') ? msg.deviceId : config.deviceId;    
                node.deviceType = msg.hasOwnProperty('deviceType') ? msg.deviceType : config.deviceType;  
                node.stopRepeat = msg.hasOwnProperty('stopRepeat') ? msg.stopRepeat : false;  
                //node.log("isRepeat: " + node.isRepeat + ", stopRepeat: " + node.stopRepeat);

                clearTimeout(node.timerId);     
                // Stop polling if the 'stopRepeat' is true
                if (node.stopRepeat) { 
                    resetRetry(node, msg);
                    node.warn(RED._("nebula.info.repeat-stopped"));
                    return; 
                } 
                // Prevent duplicate calls
                if (!node.isRunning) {
                    node.isRunning = true;
                } else {
                    return; 
                }
                if (!node.deviceId) node.warn(RED._("nebula.info.no-deviceid"));
                
                // Long Polling
                poll(nb, node.apiname, node.deviceId, node.deviceType)
                    .then(function (result) {
                        // Don't send message when the status is '204 (No content)'
                        if (result.status !== 204) {
                            let body = {};
                            if (result.hasOwnProperty('body') && result.body) {
                                body = JSON.parse(result.body);
                            }
                            Common.sendMessage(node, "ok", body, msg);
                        }
                        // Reset when poilling is successful
                        resetRetry(node, msg);
                        
                        if (!isNextCall(node)) { return; }
                        // Set next polling.
                        const message = setMessage(node);
                        node.emit("input", message);
                    })
                    .catch (function(error) {
                        msg.retryCount = node.backoffCount;
                        Common.sendMessage(node, "failed", error, msg);
                        
                        if (!isNextCall(node)) { return; }
                        // Retry connect
                        const message = setMessage(node);
                        node.timerId = retry(node, message);   
                    });
            } catch(err) {
                node.warn(err);
            }
        });
        
        this.on('close', function() {
            node.isRepeat   = false;
            node.stopRepeat = true;
        }); 
    }
    RED.nodes.registerType("device in", NebulaDeviceInNode);
    
    function NebulaDeviceOutNode(config) {
        RED.nodes.createNode(this,config);

        this.apiname = config.apiname;
        this.deviceId = config.deviceId; 
        this.deviceType = config.deviceType;
        const node = this;
        
        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula');

            try {
                // Use the value of 'msg.xxx' if the 'msg.xxx' has the property.
                node.apiname = msg.hasOwnProperty('apiname') ? msg.apiname : config.apiname;
                node.reported = msg.hasOwnProperty('reported') ? msg.reported : {};
                node.deviceId = msg.hasOwnProperty('deviceId') ? msg.deviceId : config.deviceId;    
                node.deviceType = msg.hasOwnProperty('deviceType') ? msg.deviceType : config.deviceType;
                if (!node.deviceId) node.warn(RED._("nebula.info.no-deviceid"));

                report(nb, node.apiname, node.deviceId, node.deviceType, node.reported)
                    .then(function (result) {
                        let body = {};
                        if (result.hasOwnProperty('body') && result.body) {
                            body = JSON.parse(result.body);
                        }
                        Common.sendMessage(node, "ok", body, msg);
                    })
                    .catch (function(error) {
                        Common.sendMessage(node, "failed", error, msg);
                    });
                
            } catch(err) {
                node.warn(err);
            }
        });
    }
    RED.nodes.registerType("device out", NebulaDeviceOutNode);
};





















