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

    const queryCurrent = function(nb, node, msg) {
        nb.User.queryCurrent()
            .then(function (result) {
                Common.sendMessage(node, "ok", result, msg);
            })
            .catch (function(error) {
                Common.sendMessage(node, "failed", error, msg);
            });
    };
    
    const queryUsers = function(nb, conditions, node, msg) {
        nb.User.query(conditions)
            .then(function(users) {
                Common.sendMessage(node, "ok", users, msg);
            })
            .catch(function(error) {
                Common.sendMessage(node, "failed", error, msg);
            });
    };

    function NebulaUserInNode(config) {
        RED.nodes.createNode(this,config);

        this.action = config.action;
        this.userId = config.userId; 
        const node = this;
        
        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula');

            try {
                // Use the value of 'msg.xxx' if the 'msg.xxx' has the property.
                node.action = msg.hasOwnProperty('action') ? msg.action : config.action;
                node.userId = msg.hasOwnProperty('userId') ? msg.userId : config.userId;    

                if (node.action === "GET_CURRENT_USER" ) {   
                    queryCurrent(nb, node, msg);
                } else {
                    let conditions = {};
                    conditions.limit = -1;
                    if (node.action === "GET_USER_BY_ID") {
                        if (!node.userId) {
                            throw RED._("nebula.errors.user-id-not-found"); 
                        }
                        conditions._id = node.userId;
                    }            
                    // If 'conditions._id' is undefined, get all users.
                    queryUsers(nb, conditions, node, msg);
                }
            } catch(err) {
                node.warn(err);
            }
        });
        
    }
    RED.nodes.registerType("user in", NebulaUserInNode);
};





















