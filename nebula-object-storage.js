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
    const Common = require('./nebula-common');
    
    function createClause(selectType, key, value, option, nb, node) {
        var clause = null;
        
        if(!selectType || !key) {
            return clause;
        }        
                
        switch (selectType) {
        case "eq":
            clause = nb.Clause.equals(key, value);
            break;
        case "neq":
            clause = nb.Clause.notEquals(key, value);
            break;
        case "lt":
            clause = nb.Clause.lessThan(key, value);
            break;
        case "lte":
            clause = nb.Clause.lessThanOrEqual(key, value);
            break;
        case "gt":
            clause = nb.Clause.greaterThan(key, value);
            break;
        case "gte":
            clause = nb.Clause.greaterThanOrEqual(key, value);
            break;
        case "exist":
            var flag = Boolean(value);
            clause = nb.Clause.exist(key, flag);
            break;
        case "regex":
            if (option) {
                clause = nb.Clause.regex(key, value, nb.RegexOption.CASE_INSENSITIVITY);
            } else {
                clause = nb.Clause.regex(key, value);
            }
            break;
            
        default:
            break;
        }
        return clause;
    }

    function joinClause(operator, array, size, nb, node) {
        var clause = null;
        
        if(size === 0 || !array) {
            return clause;
        }        
        
        if(size === 1) {
            clause = array[0];
            return clause;
        }   
                
        if (operator === "AND") {
            clause = nb.Clause.and.apply(this, array);
        } else { // OR
            clause = nb.Clause.or.apply(this, array);
        }

        return clause;
    }
    
    function NebulaObjectInNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;
        this.func = n.func;

        var nebulaBucketName = n.bucketName;
        
        this.rules = n.rules || [];
        
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
        
        var isClause = n.isClause;
        var operator = n.operator;
        var sortKey = n.sortKey;
        var sortType = n.sortType;
        var skipCount = n.skipCount;
        var limit = n.limit;
        var projection = n.projection;
        var bucket = null;
        var oldBucketName = null;
        
        this.on('input', function(msg) {
            var Nebula = this.context().flow.get('Nebula'); 
            //node.log("msg.payload: " + JSON.stringify(msg.payload));
                       
            try {
                // Use the value of 'msg.bucketname' if the 'msg.bucketname' has a backet name.
                var bucketName = msg.bucketname ? msg.bucketname : nebulaBucketName;
                if (!bucketName) { // null or 'undefined'
                    throw("Invalid bucketname");
                }

                if (bucketName !== oldBucketName) {
                    oldBucketName = bucketName;
                    bucket = new Nebula.ObjectBucket(bucketName);
                }
                
                var query = new Nebula.ObjectQuery();
 
                // Enable clause
                if (isClause) {
                    var rulenum = node.rules.length;
                    var clauseArray = new Array(rulenum);
                    var validCount = 0;
                    for (var i=0; i < rulenum; i++) {
                        var rule = node.rules[i];
                        var key = rule.k;
                        var selectType = rule.t;
                        var inputType = rule.vt;
                        var value = rule.v;
                        var caseFlag;
                        if (selectType === "regex") {
                            caseFlag = rule.case;
                        }
                        // Convert msg.payload to value.
                        var evaluatedValue = RED.util.evaluateNodeProperty(value, inputType, node, msg); 
                        
                        var tmp = createClause(selectType, key, evaluatedValue, caseFlag, Nebula, node);
                        if (tmp === null) {　// Skip the clause if the key is null.
                            node.warn("Clause property is Invalid (selectType, key, etc.)");
                        } else {
                            clauseArray[validCount] = tmp;
                            validCount++;
                        }
                    }
                    var clause = joinClause(operator, clauseArray, validCount, Nebula, node);
                    if (clause) {
                        query.setClause(clause); 
                    } else {
                        node.warn("NebulaObjectInNode: no clause");
                    }

                } else {
                    // get all objects
                }
                
                if (sortKey) {
                    if (sortType === "ASC") {
                        query.setSortOrder(sortKey, true);
                    } else { // DESC
                        query.setSortOrder(sortKey, false);
                    }
                }

                if (skipCount) {
                    var numSkip = RED.util.evaluateNodeProperty(skipCount, 'num', node, msg); 
                    query.setSkipCount(numSkip);
                }

                if (limit) {
                    var numLimit = RED.util.evaluateNodeProperty(limit, 'num', node, msg); 
                    query.setLimit(numLimit);
                } else {   
                    query.setLimit(100);
                }
                
                if (projection) {
                    try {
                        var tmpProjection = JSON.parse(projection);
                        var evalProjection = {};
                        
                        for (var tmpKey in tmpProjection) {
                            var strValue = tmpProjection[tmpKey];
                            // Convert string to number.
                            var numValue = RED.util.evaluateNodeProperty(strValue, 'num', node, null); 
                            evalProjection[tmpKey] = numValue;
                        }
                        
                        query.setProjection(evalProjection);
                        
                    } catch(err) {
                        throw "Invalid 'projection'. Check the json format.";                    
                    }               
                }
                //node.log("query: " + JSON.stringify(query));

                bucket.query(query)
                    .then(function(obj) {
                        Common.sendMessage(node, "ok", obj, msg);
                    })
                    .catch (function(error) {
                        Common.sendMessage(node, "failed", error, msg);
                    });
            } catch(err) {
                node.warn(err);
            }
        });
    }
    RED.nodes.registerType("object in", NebulaObjectInNode);

    function NebulaObjectOutNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.name = config.name;
        this.func = config.func;
                
        var nebulaBucketName = config.bucketName;
        var createBucket = config.createBucket;
        var action = config.action;
        var bucket = null;
        var oldBucketName = null;   
        
        this.on('input', function(msg) {
            var Nebula = this.context().flow.get('Nebula');
            var payload = msg.payload;
            //node.log("payload: " + JSON.stringify(payload));

            try {         
                // Use the value of 'msg.bucketname' if the 'msg.bucketname' has a backet name.
                var bucketName = msg.bucketname ? msg.bucketname : nebulaBucketName;
                if (!bucketName) { // null or undefined
                    throw("Invalid bucketname");
                }
                               
                var objectId = msg.objectId ? msg.objectId : null;
                      
                if (bucketName !== oldBucketName) {
                    oldBucketName = bucketName;
                    bucket = new Nebula.ObjectBucket(bucketName);
                }
                
                if (action === "SAVE_OBJECT") { 
                    bucket.save(payload)
                    .then(function(obj) {
                        Common.sendMessage(node, "ok", obj, msg);
                    })
                    .catch(function (error) {                         
                        if (error.status === 404 && error.responseText === "{\"error\":\"No such bucket\"}") {
                            if (createBucket) {  
                                // Create a bucket if no bucket exists.
                                node.warn("Try to create a new bucket('" + bucketName + "') ...");
                                bucket = new Nebula.ObjectBucket(bucketName); // Set new bucketName
                                bucket.saveBucket()
                                .then(function() {
                                    node.warn("Succeeded in creating a new bucket.");
                                })
                                .catch(function(error) {
                                    node.error("Failed to create a new bucket.");
                                });
                            }
                        }
                        Common.sendMessage(node, "failed", error, msg);
                    });

                } else if (action === "DEL_OBJECT") {
                    
                    //node.log("objectId: " + objectId);
                    bucket.remove(objectId)
                    .then(function(objid) {
                        Common.sendMessage(node, "ok", objid, msg);
                    })
                    .catch(function(error) {
                        Common.sendMessage(node, "failed", error, msg);
                    });
                    
                } else if (action === "DEL_ALL_OBJECTS") { 
                    // Query all objects.
                    var query = new Nebula.ObjectQuery();
                    query.setLimit(-1);
                    bucket.query(query)
                    .then(function(objects) {
                        var length = objects.length;
                        if (length === 0) {
                            throw RED._("nebula.errors.object-not-found");
                        }

                        // Delete all objects.
                        for (var i=0; i<length; i++) {
                            var id = objects[i]._id;
                            //node.log("objectId: " + id);
                            bucket.remove(id)
                            .then(function(objid) {
                                Common.sendMessage(node, "ok", objid, msg);
                            })
                            .catch(function(error) {
                                Common.sendMessage(node, "failed", error, msg);
                            });
                        }
                    })
                    .catch(function(error) {
                        Common.sendMessage(node, "failed", error, msg);
                    });
                } else if (action === "DEL_BUCKET") {
                    bucket.deleteBucket()
                    .then(function(obj) {
                        Common.sendMessage(node, "ok", obj, msg);
                    })
                    .catch(function (error) {
                        Common.sendMessage(node, "failed", error, msg);
                    });
                } else {
                    // do nothing.
                }
                
            } catch(err) {
                node.warn(err);
            }
        });
    }

    RED.nodes.registerType("object out", NebulaObjectOutNode);
};

