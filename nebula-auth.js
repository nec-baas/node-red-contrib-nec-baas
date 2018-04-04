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

    const login = function(nb, userInfo, node, msg) {
        nb.User.login(userInfo)
            .then(function(userObj) {                 
                Common.sendMessage(node, "ok", userObj, msg);
                node.status({fill: "green", shape: "dot", text: RED._("nebula.status.authorized")});               
            })
            .catch(function(error) {     
                Common.sendMessage(node, "failed", error, msg);
                node.status({fill: "red", shape: "ring", text: RED._("nebula.status.unauthorized")});
            });   
    };
    
    const logout = function(nb, node, msg) {
        nb.User.logout()
            .then(function() {
                Common.sendMessage(node, "ok", null, msg);
                node.status({fill: "red", shape: "ring", text: RED._("nebula.status.not-logged-in")});
            })
            .catch(function(error) {
                Common.sendMessage(node, "failed", error, msg);
                node.status({fill: "red", shape: "ring", text: RED._("nebula.status.logout-failed")});
            });
    };
    
    const setClientCert = function(nb, node, msg) {
        const certOptions = Common.readClientCertificate(node, node.config);
        nb.setClientCertificate(certOptions);
        node.context().flow.set('Nebula', nb);
        Common.sendMessage(node, "ok", null, msg);
        node.status({fill: "green", shape: "dot", text: RED._("nebula.status.cert-is-set")});
    };
    
    function NebulaInitAuthNode(config) {
        RED.nodes.createNode(this, config);

        this.nebulaServer = RED.nodes.getNode(config.nebulaServer);
        this.credAuth = this.credentials;
        this.initFlag = config.initFlag;
        this.action = config.action;

        if (config.pfxType) {
            config.certType = "CERT_TYPE_PFX";
        } else if (config.pemType) {
            config.certType = "CERT_TYPE_PEM";
        }
        
        this.config = config;
        const node = this;
        
        try {
            if (node.initFlag) {
                Common.initNebula(node, node.context(), node.nebulaServer, node.config);
            }
        } catch(err) {
            node.warn(err);
        }

        node.status({fill: "red", shape: "ring", text: RED._("nebula.status.not-logged-in")});
        
        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula');

            try {
                if (node.action === "LOGIN") { 
                    const nebulaEmail = msg.hasOwnProperty('email') ? msg.email : 
                                        (node.credAuth && node.credAuth.email ? node.credAuth.email : null);
                    const nebulaUser = msg.hasOwnProperty('username') ? msg.username : 
                                        (node.credAuth && node.credAuth.userName ? node.credAuth.userName : null);
                    const nebulaPwd = msg.hasOwnProperty('password') ? msg.password : 
                                        (node.credAuth && node.credAuth.password ? node.credAuth.password : null);
                    
                    const userInfo = {
                        "email"  : nebulaEmail,
                        "username": nebulaUser,
                        "password"  : nebulaPwd
                        };

                    login(nb, userInfo, node, msg);   
                } else if (node.action === "LOGOUT") {
                    logout(nb, node, msg); 
                } else if (node.action === "USE_CLIENT_CERT") { 
                    setClientCert(nb, node, msg);
                } else {
                    node.warn(RED._("nebula.errors.no-action-selected"));
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
