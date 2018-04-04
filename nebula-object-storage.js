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
    
    const createClause = function(selectType, key, value, option, nb, node) {
        let clause = null;
        
        if (!selectType || !key) {
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
            const flag = Boolean(value);
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

    const joinClause = function(operator, array, size, nb, node) {
        let clause = null;
        
        if (size === 0 || !array) {
            return clause;
        }        
        
        if (size === 1) {
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
    
    const buildClause = function(nb, node, msg) {  
        const rulenum = node.rules.length;
        let clauseArray = new Array(rulenum);
        let validCount = 0;
        for (let i=0; i < rulenum; i++) {
            const rule = node.rules[i];
            const key = rule.k;
            const selectType = rule.t;
            const inputType = rule.vt;
            const value = rule.v;
            let caseFlag;
            if (selectType === "regex") {
                caseFlag = rule.case;
            }
            // Convert msg.payload to value.
            const evaluatedValue = RED.util.evaluateNodeProperty(value, inputType, node, msg); 
            
            const clause = createClause(selectType, key, evaluatedValue, caseFlag, nb, node);
            if (clause === null) { // Skip the clause if the key is null.
                node.warn("Clause property is Invalid (selectType, key, etc.)");
            } else {
                clauseArray[validCount] = clause;
                validCount++;
            }
        }
        
        return joinClause(node.operator, clauseArray, validCount, nb, node);
    }
    
    const queryObject = function(query, node, msg) {  
        node.bucket.query(query)
            .then(function(obj) {
                Common.sendMessage(node, "ok", obj, msg);
            })
            .catch (function(error) {
                Common.sendMessage(node, "failed", error, msg);
            });
    }
    
    const buildProjection = function(node, msg) { 
        const tmpProjection = JSON.parse(node.projection);
        let evalProjection = {};
        
        for (let tmpKey in tmpProjection) {
            const strValue = tmpProjection[tmpKey];
            // Convert string to number.
            const numValue = RED.util.evaluateNodeProperty(strValue, 'num', node, null); 
            evalProjection[tmpKey] = numValue;
        }
        
        return evalProjection;
    }
    
    function NebulaObjectInNode(config) {
        RED.nodes.createNode(this,config);

        this.bucketName = config.bucketName;
        this.rules = config.rules || [];

        this.isClause = config.isClause;
        this.operator = config.operator;
        this.sortKey = config.sortKey;
        this.sortType = config.sortType;
        this.skipCount = config.skipCount;
        this.limit = config.limit;
        this.projection = config.projection;
        this.bucket = null;
        this.oldBucketName = null;
        const node = this;
        
        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula'); 
                       
            try {
                // Use the value of 'msg.bucketname' if the 'msg.bucketname' has a backet name.
                const bucketName = msg.hasOwnProperty('bucketname') ? msg.bucketname : config.bucketName;
                if (!bucketName) { // null or 'undefined'
                    throw RED._("nebula.errors.invalid-bucketname");
                }
                if (bucketName !== node.oldBucketName) {
                    node.oldBucketName = bucketName;
                    node.bucket = new nb.ObjectBucket(bucketName);
                }
                const query = new nb.ObjectQuery();
 
                // Enable clause
                if (node.isClause) {
                    const clause = buildClause(nb, node, msg);
                    if (clause) {
                        query.setClause(clause); 
                    } else {
                        node.warn(RED._("clause-not-found"));
                    }
                } else {
                    // get all objects
                }
     
                if (node.sortKey) {
                    if (node.sortType === "ASC") {
                        query.setSortOrder(node.sortKey, true);
                    } else { // DESC
                        query.setSortOrder(node.sortKey, false);
                    }
                }

                if (node.skipCount) {
                    const numSkip = RED.util.evaluateNodeProperty(node.skipCount, 'num', node, msg); 
                    query.setSkipCount(numSkip);
                }

                if (node.limit) {
                    const numLimit = RED.util.evaluateNodeProperty(node.limit, 'num', node, msg); 
                    query.setLimit(numLimit);
                } else {   
                    query.setLimit(100);
                }

                if (node.projection) {
                   try {
                        const projection = buildProjection(node, msg);
                        query.setProjection(projection);
                    } catch(err) {
                        throw RED._("nebula.errors.invalid-projection");
                    }
                }

                queryObject(query, node, msg);
            } catch(err) {
                node.warn(err);
            }
        });
    }
    RED.nodes.registerType("object in", NebulaObjectInNode);
    
    const createBucket = function(nb, node, bucketName, msg) {   
        // Create a bucket if no bucket exists.
        node.warn(RED._("nebula.info.try-to-create-a-new-bucket") + "('" + bucketName + "') ...");
        node.bucket = new nb.ObjectBucket(bucketName); // Set new bucketName
        node.bucket.saveBucket()
        .then(function() {
            node.warn(RED._("nebula.info.succeeded-in-creating-a-new-bucket"));
        })
        .catch(function(error) {
            node.error(RED._("nebula.errors.failed-to-create-a-new-bucket"));
        });
    }
      
    const saveObject = function(nb, node, bucketName, payload, msg) {  
        node.bucket.save(payload)
        .then(function(obj) {
            Common.sendMessage(node, "ok", obj, msg);
        })
        .catch(function (error) {                         
            if (error.status === 404 && error.responseText === "{\"error\":\"No such bucket\"}") {
                if (node.createBucket) {  
                    createBucket(nb, node, bucketName, msg);
                }
            }
            Common.sendMessage(node, "failed", error, msg);
        });
    }            
                    
    const deleteObject = function(objectId, node, msg) {                    
        node.bucket.remove(objectId)
        .then(function(objid) {
            Common.sendMessage(node, "ok", objid, msg);
        })
        .catch(function(error) {
            Common.sendMessage(node, "failed", error, msg);
        });
    } 
                    
    const deleteAllObjects = function(nb, node, msg) {
        // Query all objects.
        const query = new nb.ObjectQuery();
        query.setLimit(-1);
        node.bucket.query(query)
        .then(function(objects) {
            const length = objects.length;
            if (length === 0) {
                throw RED._("nebula.errors.object-not-found");
            }

            // Delete all objects.
            for (let i=0; i<length; i++) {
                const id = objects[i]._id;

                node.bucket.remove(id)
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
    }   
                    
    const deleteBucket = function(node, msg) {
        node.bucket.deleteBucket()
        .then(function(obj) {
            Common.sendMessage(node, "ok", obj, msg);
        })
        .catch(function (error) {
            Common.sendMessage(node, "failed", error, msg);
        });
    }
    
    function NebulaObjectOutNode(config) {
        RED.nodes.createNode(this,config);

        this.bucketName = config.bucketName;
        this.createBucket = config.createBucket;
        this.action = config.action;
        this.bucket = null;
        this.oldBucketName = null;   
        const node = this;
        
        this.on('input', function(msg) {
            const nb = node.context().flow.get('Nebula');
            const payload = msg.payload;

            try {         
                // Use the value of 'msg.bucketname' if the 'msg.bucketname' has a backet name.
                const bucketName = msg.hasOwnProperty('bucketname') ? msg.bucketname : config.bucketName;
                if (!bucketName) { // null or undefined
                    throw RED._("nebula.errors.invalid-bucketname");
                }    
                if (bucketName !== node.oldBucketName) {
                    node.oldBucketName = bucketName;
                    node.bucket = new nb.ObjectBucket(bucketName);
                }
                
                if (node.action === "SAVE_OBJECT") { 
                    saveObject(nb, node, bucketName, payload, msg);
                } else if (node.action === "DEL_OBJECT") {
                    const objectId = msg.hasOwnProperty('objectId') ? msg.objectId : null;
                    deleteObject(objectId, node, msg);  
                } else if (node.action === "DEL_ALL_OBJECTS") { 
                    deleteAllObjects(nb, node, msg);
                } else if (node.action === "DEL_BUCKET") {
                    deleteBucket(node, msg);
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

