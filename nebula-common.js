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

'use strict';

const Nebula = require('./lib/baas.min');

/**
 * Common
 */
class Common {
    static initNebula(node, context, nebulaServer) {
        Common.setupProxy(node);

        if (nebulaServer != null) {
            let service = context.flow.get('Nebula');

            // Create Nebula service if the service does't exist.
            if (service == null) { // null or undefined
                service = new Nebula.NebulaService();
                node.log("Nebula service is created.");
            }
            // Initialize Nebula
            service.initialize(nebulaServer.nebulaConfig);
            context.flow.set('Nebula', service); // Available in the downstream processes in the same flow.
        } else {
            node.warn("Initialize is enabled, but Nebula config is not set.");
            context.flow.set('Nebula', null);
        }
    }

    static setupProxy(node) {
        const proxy = Common.getProxyConfig();
        if (proxy) {
            Nebula.setHttpProxy(proxy);
            Nebula.setHttpsProxy(proxy);
            node.log("proxy: " + JSON.stringify(proxy));
        }
    }

    static getProxyConfig() {
        let proxy;

        // Get the proxy info from the environment variable.
        if (process.env.http_proxy || process.env.https_proxy
            || process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {

            var httpProxy = process.env.http_proxy ? process.env.http_proxy : process.env.HTTP_PROXY;
            var httpsProxy = process.env.https_proxy ? process.env.https_proxy : process.env.HTTPS_PROXY;
            var proxyConfig = httpProxy ? httpProxy : httpsProxy;

            if (proxyConfig) {
                var m = process.env.http_proxy.match(/^(http:\/\/)?([^:\/]+)(:([0-9]+))?/i);
                if (m && m.length >= 3) {
                    proxy = {
                        host: m[2],
                        port: (m[4] != null ? m[4] : 80)
                    };
                }
            }
        }
        return proxy;
    }

    static csv2json(csv){
        var array = [];
        var values = csv.split(',');

        for (var i=0; i<values.length; i++) {
            var value = values[i].trim();
            if (value) {
                array.push(value);
            }
        }
        return array;
    }
    
    static sendMessage(node, result, payload, msg){  
        msg.payload = payload;
        msg.result = result;
        node.send(msg);
    }
}

module.exports = Common;
