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
        
        if(size==0 || !array) {
            return clause;
        }        
                
        if (operator === "AND") {
            switch (size) {
            case 1:
                clause = array[0]; // Use "and" operator once
                break;
            case 2:
                clause = nb.Clause.and(array[0], array[1]); // Use "and" operator twice
                break;
            case 3:
                clause = nb.Clause.and(array[0], array[1], array[2]); // Use "and" operator three times
                break;
            default:
                break;
            }
        
        } else { // OR
            switch (size) {
            case 1:
                clause = array[0]; // Use "and" operator once
                break;
            case 2:
                clause = nb.Clause.or(array[0], array[1]); // Use "and" operator twice
                break;
            case 3:
                clause = nb.Clause.or(array[0], array[1], array[2]); // Use "and" operator three times
                break;
            default:
                break;
            }
        }
        return clause;
    }
    
    function NebulaObjectInNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.name = n.name;
        this.func = n.func;

        var nebulaServer = RED.nodes.getNode(n.nebulaServer);
        var nebulaBucketName = n.bucketName;
        
        this.rules = n.rules || [];
        var node = this;
        
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
        
        var noClause = n.noClause;
        var operator = n.operator;
        var sortKey = n.sortKey;
        var sortType = n.sortType;
        var projection = n.projection;
        
        this.on('input', function(msg) {
            var Nebula = this.context().flow.get('Nebula'); 
            //node.log("msg.payload: " + JSON.stringify(msg.payload));
                       
            try {
                // Use the value of 'msg.bucketname' if the 'msg.bucketname' has a backet name.
                var bucketName = msg.bucketname ? msg.bucketname : nebulaBucketName;
                if (bucketName == null) { // null or 'undefined'
                    node.error("Bucketname is null");
                    return;
                }

                var bucket = new Nebula.ObjectBucket(bucketName); 
                var query = new Nebula.ObjectQuery();
                query.setLimit(-1);
 
                // Use clause
                if (!noClause) {　
                    var clauseArray = new Array(3);
                    var validCount = 0;
                    for (var i=0; i < node.rules.length; i++) {
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
                        var inputType = rule.vt;
                        
                        var tmp = createClause(selectType, key, evaluatedValue, caseFlag, Nebula, node);
                        if (tmp == null) {　// Skip the clause if the key is null.
                            node.warn("Clause argument is Invalid (selectType, key, etc.)");
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
                if (projection) {
                    var tmpProjection = JSON.parse(projection);
                    var evalProjection = {};
                    
                    for (var i = 0, a = Object.keys(tmpProjection); i < a.length; i++) {
                        var key = a[i];
                        var strvalue = tmpProjection[key];
                        // Convert string to number.
                        var numValue = RED.util.evaluateNodeProperty(strvalue, 'num', node, null); 
                        evalProjection[key] = numValue;
                    }
                    query.setProjection(evalProjection);
                }
  
                //node.log("query: " + JSON.stringify(query));
                
                bucket.query(query)
                    .then(function(obj) {
                        node.send({result: "ok", payload: obj});
                    })
                    .catch (function(error) {
                        node.send({result: "failed", payload: error});
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

        this.on('input', function(msg) {
            var Nebula = this.context().flow.get('Nebula');
            //node.log("msg.payload: " + JSON.stringify(msg.payload));
            
            try {         
                // Use the value of 'msg.bucketname' if the 'msg.bucketname' has a backet name.
                var bucketName = msg.bucketname ? msg.bucketname : nebulaBucketName;
                if (bucketName == null) { // null or undefined
                    node.error("Bucketname is null");
                }
                
                var bucket = new Nebula.ObjectBucket(bucketName);
                //bucket.setAcl(new Nebula.Acl());
                //bucket.setContentAcl(new Nebula.Acl());

                if (action === "SAVE_OBJECT") { 
                    Nebula.ObjectBucket.loadBucket(bucketName)
                    .catch((err) => {
                        if (createBucket) {
                            // Create a bucket if no bucket exists.
                            return bucket.saveBucket();
                        } else {
                            node.error("Bucket not found", msg);
                            return;
                        }
                    })
                    .then(() => {
                        return bucket.save(msg.payload);
                    })
                    .then(function(obj) {
                        node.send({result: "ok", payload: obj});
                    })
                    .catch(function (error) {
                        node.send({result: "failed", payload: error});
                    });
                } else if (action === "DEL_OBJECT") { // DELETE
                    // Query all objects.
                    var query = new Nebula.ObjectQuery();
                    query.setLimit(-1);
                    
                    bucket.query(query)
                    .then(function(objects) {
                        var length = objects.length;
                        //node.log("query: object size: " +  length);
                        node.send({result: "ok", payload: objects});
                        // Delete all objects.
                        for (var i=0; i<length; i++) {
                            var objectId = objects[i]["_id"];
                            node.log("objectId: " + objectId);
                            bucket.remove(objectId)
                            .then(function(objid) {
                                node.send({result: "ok", payload: objid});
                            })
                            .catch(function(error) {
                                node.send({result: "failed", payload: error});
                            });
                        }
                    })
                    .catch(function(error) {
                        node.send({result: "failed", payload: error});
                    });
                } else if (action === "DEL_BUCKET") { // DELETE
                    bucket.deleteBucket()
                    .then(function(obj) {
                        node.send({result: "ok", payload: bucket});
                    })
                    .catch(function (error) {
                        node.send({result: "failed", payload: error});
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

