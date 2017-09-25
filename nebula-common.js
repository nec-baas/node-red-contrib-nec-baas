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

const fs = require('fs');
const URL = require('url');
const Nebula = require('./lib/baas.min');
   
/**
 * Common
 */
class Common {
    static initNebula(node, context, nebulaServer, config) {
    
        if (nebulaServer) {
            let service = context.flow.get('Nebula');
            // Create Nebula service if the service does't exist.
            if (!service) { // null or undefined
                service = new Nebula.NebulaService();
                node.log("Nebula service is created.");
            }
            // Initialize Nebula
            service.initialize(nebulaServer.nebulaConfig);
            
            // Set Proxy
            if (nebulaServer.nebulaConfig && nebulaServer.nebulaConfig.useProxy === undefined) {
                // If the 'useProxy' is not defined, enable the 'useProxy' to check proxy.
                nebulaServer.nebulaConfig.useProxy = true; 
            }
            Common.setupProxy(Nebula, nebulaServer.nebulaConfig.useProxy, node);

            context.flow.set('Nebula', service); // Available in the downstream processes in the same flow.
        } else {
            node.warn("Initialize is enabled, but Nebula config is not set.");
            context.flow.set('Nebula', null);
        }
    }

    static setupProxy(nebula, useProxy, node) {
        const proxy = Common.getProxyConfig();
  
        if (useProxy && proxy) {
            let httpProxy = {
                host: proxy.http.hostname,
                port: Number(proxy.http.port)
            };
            
            let httpsProxy = {
                host: proxy.https.hostname,
                port: Number(proxy.https.port)
            };
                      
            nebula.setHttpProxy(httpProxy);
            nebula.setHttpsProxy(httpsProxy);
            node.log("proxy: http:" + JSON.stringify(httpProxy) + ", https:" + JSON.stringify(httpsProxy));
        } else {
            nebula.setHttpProxy(null);
            nebula.setHttpsProxy(null);
            node.log("proxy: null");
        }
    }

    static getProxyConfig() {
        let proxyConfig = null;

        // Get the proxy info from the environment variable.
        if (process.env.http_proxy || process.env.https_proxy
            || process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {

            let httpProxy = process.env.http_proxy ? process.env.http_proxy : process.env.HTTP_PROXY;
            let httpsProxy = process.env.https_proxy ? process.env.https_proxy : process.env.HTTPS_PROXY;

            let httpUrl = URL.parse(httpProxy);
            let httpsUrl = URL.parse(httpsProxy);

            proxyConfig = {
                http: httpUrl,
                https: httpsUrl
            };
        }
        return proxyConfig;
    }

    static csv2json(csv){
        let array = [];
        let values = csv.split(',');

        for (let i=0; i<values.length; i++) {
            let value = values[i].trim();
            if (value) {
                array.push(value);
            }
        }
        return array;
    }
    
    static sendMessage(node, result, payload, msg){  
        msg.result = result;
        msg.payload = payload; 
        node.send(msg); 
    }

    static readClientCertificate(node, config) {
            
            let certType = config.certType;
            let pfxCertPath = config.pfxCertPath; 
            let pemCertPath = config.pemCertPath; 
            let pemKeyPath = config.pemKeyPath; 
            let passPhrase = config.passPhrase; 
            let caCertPath = config.caCertPath;
            let certOptions = null;
            
            if (!config.pfxCertPath && !config.pemCertPath) {
                node.error("'Use client certfificate' is enabled, but Certificate file path is not set.");
                return null;
            }
            
            if (certType === "CERT_TYPE_PFX") {
                certOptions = {
                    pfx: fs.readFileSync(pfxCertPath),
                    passphrase: passPhrase,
                    ca: fs.readFileSync(caCertPath)
                };
            } else if (certType === "CERT_TYPE_PEM"){
                certOptions = {
                    cert: fs.readFileSync(pemCertPath),
                    key: fs.readFileSync(pemKeyPath),
                    ca: fs.readFileSync(caCertPath)
                };
            } else {
                // do nothing.
            }
                                     
            return certOptions;
    }
}

module.exports = Common;
