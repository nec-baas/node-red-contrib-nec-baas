/**
 * Copyright 2013,2015 IBM Corp.
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
 **/
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

module.exports = function(RED) {
    "use strict";
    const Common = require('./nebula-common');

    function NebulaInitAuthNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.name = config.name;
        this.func = config.func;

        var nebulaServer = RED.nodes.getNode(config.nebulaServer);
        var credAuth = this.credentials;
        
        var initFlag = config.initFlag;
        var action = config.action;
        
        try {
            if (initFlag) {
                Common.initNebula(node, this.context(), nebulaServer);
            } else {
                // no initialize
            }
        } catch(err) {
            node.warn(err);
        }

        node.status({fill: "red", shape: "ring", text: "not logged in"});
        
        this.on('input', function(msg) {
            var Nebula = this.context().flow.get('Nebula');
            
            try {
                if (action === "LOGIN") { 
                    var nebulaEmail = msg.email ? msg.email : (credAuth && credAuth.email ? credAuth.email : null);
                    var nebulaUser = msg.username ? msg.username : (credAuth && credAuth.userName ? credAuth.userName : null);
                    var nebulaPwd = msg.password ? msg.password : (credAuth && credAuth.password ? credAuth.password : null);
                    
                    var userInfo = {
                        "email"  : nebulaEmail,
                        "username": nebulaUser,
                        "password"  : nebulaPwd
                        };

                    Nebula.User.login(userInfo)
                        .then(function(userObj) {
                            node.send({result: "ok", payload: userObj});
                            node.status({fill: "green", shape: "dot", text: "authorized"});
                        })
                        .catch(function(error) {
                            node.send({result: "failed", payload: error});
                            node.status({fill: "red", shape: "ring", text: "unauthorized"});
                        });
                } else { // LOGOUT
                    Nebula.User.logout()
                        .then(function() {
                            node.send({result: "ok"});
                            node.status({fill: "red", shape: "ring", text: "not logged in"});
                        })
                        .catch(function(error) {
                            node.send({result: "failed", payload: error});
                            node.status({fill: "red", shape: "ring", text: "logout failed"});
                        });
                }
            } catch(err) {
                node.warn(err);
            }   
        });
    }
    RED.nodes.registerType("auth", NebulaInitAuthNode, {
        credentials: {
            email: {type:"text"},
            userName: {type:"text"},
            password: {type:"password"}
        }
    });
}
