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

module.exports = function (RED) {
    "use strict";
    const util = require("util");
    const vm = require("vm");
    const Common = require('./nebula-common');

    function sendResults(node,_msgid,msgs) {
        if (!msgs) {
            return;
        } else if (!util.isArray(msgs)) {
            msgs = [msgs];
        }
        let msgCount = 0;
        for (let m=0; m<msgs.length; m++) {
            if (msgs[m]) {
                if (util.isArray(msgs[m])) {
                    for (let n=0; n < msgs[m].length; n++) {
                        msgs[m][n]._msgid = _msgid;
                        msgCount++;
                    }
                } else {
                    msgs[m]._msgid = _msgid;
                    msgCount++;
                }
            }
        }
        if (msgCount>0) {
            node.send(msgs);
        }
    }

    function NebulaFunctionNode(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        this.name = config.name;
        this.func = config.func;
        const functionText = "var results = null;"+
                           "results = (function(msg){ "+
                              "var __msgid__ = msg._msgid;"+
                              "var node = {"+
                                 "log:__node__.log,"+
                                 "error:__node__.error,"+
                                 "warn:__node__.warn,"+
                                 "on:__node__.on,"+
                                 "status:__node__.status,"+
                                 "send:function(msgs){ __node__.send(__msgid__,msgs);}"+
                              "};\n"+
                              this.func+"\n"+
                           "})(msg);";

        this.topic = config.topic;
        this.outstandingTimers = [];
        this.outstandingIntervals = [];

        const stringify = function (obj) {
            return (typeof obj === 'string') ? "'" + obj + "'" : obj;
        };

        const initFlag = config.initFlag;
        const nebulaServer = RED.nodes.getNode(config.nebulaServer);

        try {   
            if (initFlag) {
                Common.initNebula(node, this.context(), nebulaServer);
            } else {
                // no initialize
            }
        } catch(err) {
            this.error(err);
        }

        const sandbox = {
            console: console,
            util: util,
            nebula: {
                get: function () {
                    return node.context().flow.get('Nebula');
                }
            },
            Buffer: Buffer,
            __node__: {
                log: function () {
                    node.log.apply(node, arguments);
                },
                error: function () {
                    node.error.apply(node, arguments);
                },
                warn: function () {
                    node.warn.apply(node, arguments);
                },
                send: function (id, msgs) {
                    sendResults(node, id, msgs);
                },
                on: function () {
                    node.on.apply(node, arguments);
                },
                status: function () {
                    node.status.apply(node, arguments);
                }
            },
            context: {
                set: function () {
                    node.context().set.apply(node, arguments);
                },
                get: function () {
                    return node.context().get.apply(node, arguments);
                },
                get global() {
                    return node.context().global;
                },
                get flow() {
                    return node.context().flow;
                }
            },
            flow: {
                set: function () {
                    node.context().flow.set.apply(node, arguments);
                },
                get: function () {
                    return node.context().flow.get.apply(node, arguments);
                }
            },
            global: {
                set: function () {
                    node.context().global.set.apply(node, arguments);
                },
                get: function () {
                    return node.context().global.get.apply(node, arguments);
                }
            },
            setTimeout: function () {
                const func = arguments[0];
                arguments[0] = function () {
                    sandbox.clearTimeout(timerId);
                    try {
                        func.apply(this, arguments);
                    } catch (err) {
                        node.error(err, {});
                    }
                };
                const timerId = setTimeout.apply(this, arguments);
                node.outstandingTimers.push(timerId);
                return timerId;
            },
            clearTimeout: function (id) {
                clearTimeout(id);
                const index = node.outstandingTimers.indexOf(id);
                if (index > -1) {
                    node.outstandingTimers.splice(index, 1);
                }
            },
            setInterval: function () {
                const func = arguments[0];
                arguments[0] = function () {
                    try {
                        func.apply(this, arguments);
                    } catch (err) {
                        node.error(err, {});
                    }
                };
                const timerId = setInterval.apply(this, arguments);
                node.outstandingIntervals.push(timerId);
                return timerId;
            },
            clearInterval: function (id) {
                clearInterval(id);
                const index = node.outstandingIntervals.indexOf(id);
                if (index > -1) {
                    node.outstandingIntervals.splice(index, 1);
                }
            }
        };
        const context = vm.createContext(sandbox);
        try {
            this.script = vm.createScript(functionText);
            this.on("input", function(msg) {
            
                try {
                    const start = process.hrtime();
                    context.msg = msg;
                    this.script.runInContext(context);
                    sendResults(this,msg._msgid,context.results);

                    const duration = process.hrtime(start);
                    const converted = Math.floor((duration[0] * 1e9 + duration[1]) / 10000) / 100;
                    this.metric("duration", msg, converted);
                    if (process.env.NODE_RED_FUNCTION_TIME) {
                        this.status({fill:"yellow",shape:"dot",text:""+converted});
                    }
                } catch(err) {

                    let line = 0;
                    let errorMessage;
                    const stack = err.stack.split(/\r?\n/);
                    if (stack.length > 0) {
                        while (line < stack.length && stack[line].indexOf("ReferenceError") !== 0) {
                            line++;
                        }

                        if (line < stack.length) {
                            errorMessage = stack[line];
                            const m = /:(\d+):(\d+)$/.exec(stack[line + 1]);
                            if (m) {
                                const lineno = Number(m[1]) - 1;
                                const cha = m[2];
                                errorMessage += " (line "+lineno+", col "+cha+")";
                            }
                        }
                    }
                    if (!errorMessage) {
                        errorMessage = err.toString();
                    }
                    this.error(errorMessage, msg);
                }
            });
            this.on("close", function() {
                while(node.outstandingTimers.length > 0) {
                    clearTimeout(node.outstandingTimers.pop());
                }
                while(node.outstandingIntervals.length > 0) {
                    clearInterval(node.outstandingIntervals.pop());
                }
            })
        } catch(err) {
            // eg SyntaxError - which v8 doesn't include line number information
            // so we can't do better than this
            this.error(err);
        }
    }
    RED.nodes.registerType("function out", NebulaFunctionNode);
}
