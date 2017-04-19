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
    
    function NebulaApigwOutNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.name = config.name;
        this.func = config.func;

        var apiname = config.apiname;
        var method = config.method;
        var subpath = config.subpath;
        var apidata = config.apidata;
        var isJsonRequest = config.isJsonRequest;    
        
        var isAddHeaders = config.isAddHeaders;
        var isClearHeaders = config.isClearHeaders;
        var contentType = config.contentType;
        
        var isJsonResponse = config.isJsonResponse;      
        var isBinary = config.isBinaryResponse;        
                
        this.rules = config.rules || [];

        for (var i=0; i<this.rules.length; i++) {
            var rule = this.rules[i];
            if (!rule.vt) {
                if (!isNaN(Number(rule.v))) {
                    rule.vt = 'num';
                } else {
                    rule.vt = 'str';
                }
            }
            if (rule.vt === 'num') {
                if (!isNaN(Number(rule.v))) {
                    rule.v = Number(rule.v);
                }
            }
        }

        this.on('input', function(msg) {
            var Nebula = this.context().flow.get('Nebula');

            try {
                // Use the value of 'msg.xxx' if the 'msg.xxx' has the property.
                apiname = msg.apiname ? msg.apiname : apiname;
                method = msg.method ? msg.method : method;
                subpath = msg.subpath ? msg.subpath : subpath;
                apidata = msg.apidata ? msg.apidata : (apidata ? apidata : {});
                isBinary = msg.isBinaryResponse ? msg.isBinaryResponse : isBinary;
                isClearHeaders = msg.header ? (msg.header.isClearHeaders ? msg.header.isClearHeaders : isClearHeaders) : isClearHeaders;
                contentType = msg.header ? (msg.header.contentType ? msg.header.contentType : contentType) : contentType;
                var addHeaders = msg.header ? (msg.header.addHeaders ? msg.header.addHeaders : {}) : {};

                try { 
                    if (isJsonRequest && typeof apidata  === "string") {
                        apidata = JSON.parse(apidata);
                    }
                } catch(err) {
                    throw RED._("nebula.errors.invalid-apidata");                    
                }
 
                var customApi = new Nebula.CustomApi(apiname, method, subpath);
                
                if (isBinary) {
                    customApi.setBinaryResponse();
                }
                
                if (Object.keys(addHeaders).length) {
                    for (var headerKey in addHeaders) {
                        var headerValue = addHeaders[headerKey];
                        customApi.addHeader(headerKey, headerValue);
                    }
                } else {
                    if (isAddHeaders) {
                        for (var i = 0; i < node.rules.length; i++) {
                            var rule = node.rules[i];
                            var key = rule.k;
                            var inputType = rule.vt;
                            var value = rule.v;
                            // Convert msg.xxx property to value.
                            var evaluatedValue = RED.util.evaluateNodeProperty(value, inputType, node, msg);
                            customApi.addHeader(key, evaluatedValue);
                        }
                    }
                }
                
                if (isClearHeaders) {
                    customApi.clearHeaders();
                }

                if (contentType) {
                    customApi.setContentType(contentType);
                }
                //node.log("customApi: " + JSON.stringify(customApi));

                customApi.execute(apidata)
                    .then(function (result) {
                        if (isJsonResponse && !isBinary) {
                            result = JSON.parse(result);
                        }
                        Common.sendMessage(node, "ok", result, msg);
                    })
                    .catch (function(error) {
                        Common.sendMessage(node, "failed", error, msg);
                    });
                
            } catch(err) {
                node.warn(err);
            }
        });
    }

    RED.nodes.registerType("apigw out", NebulaApigwOutNode);
};

