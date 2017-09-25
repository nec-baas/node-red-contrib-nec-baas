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
    'use restrict';

    function NebulaServerNode(config) {

        RED.nodes.createNode(this, config);
        var credentials = this.credentials;
        var node = this;

        if (credentials) {
            node.nebulaConfig = {
                tenant: config.tenantId,
                appId: credentials.appId,
                appKey: credentials.appKey,
                baseUri: config.baseUri,
                offline: false,
                debugMode: "release",
                useProxy: config.useProxy
            };
        } else {
            node.error("Credentials not found");
        }
    }

    RED.nodes.registerType('nebula-server', NebulaServerNode, {
        credentials: {
            appId: {type: "text"},
            appKey: {type: "text"}
        }
    });
};
