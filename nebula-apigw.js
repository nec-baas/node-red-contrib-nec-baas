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

    const executeApi = function(api, node, msg) {
        api.execute(node.apidata)
            .then(function (result) {
                if (node.isJsonResponse && !node.isBinary) {
                    result = JSON.parse(result);
                }
                Common.sendMessage(node, "ok", result, msg);
            })
            .catch (function(error) {
                Common.sendMessage(node, "failed", error, msg);
            });
    };

    function NebulaApigwOutNode(config) {
        RED.nodes.createNode(this,config);

        this.apiname = config.apiname;
        this.method = config.method;
        this.subpath = config.subpath;
        this.apidata = config.apidata;
        this.isJsonRequest = config.isJsonRequest;    
        
        this.isAddHeaders = config.isAddHeaders;
        this.isClearHeaders = config.isClearHeaders;
        this.contentType = config.contentType;
        this.isJsonResponse = config.isJsonResponse;      
        this.isBinary = config.isBinaryResponse;        
                
        this.rules = config.rules || [];
        const node = this;

        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula');

            try {
                // Use the value of 'msg.xxx' if the 'msg.xxx' has the property.
                node.apiname = msg.hasOwnProperty('apiname') ? msg.apiname : config.apiname;
                node.method = msg.hasOwnProperty('method') ? msg.method : config.method;
                node.subpath = msg.hasOwnProperty('subpath') ? msg.subpath : config.subpath;
                node.apidata = msg.hasOwnProperty('apidata') ? msg.apidata : (config.apidata ? config.apidata : {});
                node.isBinary = msg.hasOwnProperty('isBinaryResponse') ? msg.isBinaryResponse : config.isBinaryResponse;
                node.isClearHeaders = (msg.hasOwnProperty('header') && msg.header.hasOwnProperty('isClearHeaders')) ? 
                                        msg.header.isClearHeaders : config.isClearHeaders;
                node.contentType = (msg.hasOwnProperty('header') && msg.header.hasOwnProperty('contentType')) ? 
                                        msg.header.contentType : config.contentType;
                const addHeaders = (msg.hasOwnProperty('header') && msg.header.hasOwnProperty('addHeaders')) ? msg.header.addHeaders : {};

                try { 
                    if (node.isJsonRequest && typeof node.apidata  === "string") {
                        node.apidata = JSON.parse(node.apidata);
                    }
                } catch(err) {
                    throw RED._("nebula.errors.invalid-apidata");                    
                }

                const customApi = new nb.CustomApi(node.apiname, node.method, node.subpath);

                if (node.isBinary) {
                    customApi.setBinaryResponse();
                }

                if (Object.keys(addHeaders).length) {
                    for (let headerKey in addHeaders) {
                        const headerValue = addHeaders[headerKey];
                        customApi.addHeader(headerKey, headerValue);
                    }
                } else {
                    if (node.isAddHeaders) {
                        for (let i = 0; i < node.rules.length; i++) {
                            const rule = node.rules[i];
                            const key = rule.k;
                            const inputType = rule.vt;
                            const value = rule.v;
                            // Convert msg.xxx property to value.
                            const evaluatedValue = RED.util.evaluateNodeProperty(value, inputType, node, msg);
                            customApi.addHeader(key, evaluatedValue);
                        }
                    }
                }

                if (node.isClearHeaders) {
                    customApi.clearHeaders();
                }

                if (node.contentType) {
                    customApi.setContentType(node.contentType);
                }

                executeApi(customApi, node, msg);
                
            } catch(err) {
                node.warn(err);
            }
        });
    }

    RED.nodes.registerType("apigw out", NebulaApigwOutNode);
};

