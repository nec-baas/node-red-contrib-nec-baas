node-red-contrib-nec-baas 
===============

本モジュールは、 Node-RED 上で NEC モバイルバックエンド基盤(以下、NEC BaaS)にアクセスする機能を提供します。

提供する機能
------------

提供する機能(ノード)は以下のとおりです。
* NEC BaaS への認証(ログイン/ログアウト)に使用するノード
* NEC BaaS のオブジェクトストレージからデータ取得するノード
* NEC BaaS のオブジェクトストレージへデータを保存するノード
* NEC BaaS が提供する様々な機能を JavaScript で記述できるノード
* NEC BaaS の管理下にあるクライアント端末に Push 送信するノード
* NEC BaaS に登録された API (プログラム)を実行するノード

インストール
------------

Node-RED のルートディレクトリ上で、以下のコマンドを実行してください。

npm install node-red-contrib-nec-baas

アンインストール
------------

Node-RED のユーザディレクトリ上で、以下のコマンドを実行してください。

npm uninstall node-red-contrib-nec-baas

利用方法
--------

1. NEC BaaS の認証ノード

    NEC BaaS への認証(ログイン/ログアウト)に使用するノードです。
    認証ノード(auth)の設定ダイアログを開き、以下を設定してください。  
    * `Initialize?` をチェック後、接続先の`NEC BaaS サーバ`情報を `Config` 欄に設定します。
    * ログイン認証を行う場合は、 `Action` 欄を `login` としてください。
    * ログイン認証に必要なアカウント情報を `Email`　(または `User`), `Password` 欄に入力してください。
   
2. NEC BaaS のデータ保存ノード

    NEC BaaS のオブジェクトストレージへデータを保存するノードです。
    データ保存ノード(object)の設定ダイアログを開き、以下を設定してください。  
    * `Bucket Name` 欄に Bucket 名を入力してください。

3. NEC BaaS のデータ取得ノード

    NEC BaaS のオブジェクトストレージからデータを取得するノードです。
    データ取得ノード(object)の設定ダイアログを開き、以下を設定してください。  
    * `Bucket Name` 欄に Bucket 名を入力してください。
    * 全てのオブジェクトデータを取得する場合は、 `Use Search conditions?` のチェックを無効にしてください。
    * 検索条件を指定する場合は、 `Use Search conditions?` のチェックを有効にして条件式を入力してください。
　　　
4. NEC BaaS の Function ノード

    NEC BaaS が提供する様々な機能(詳細なロジック等)を JavaScript で記述できるノードです。
    `Function` 欄 に 実行するスクリプトを記述します。
   
    **CAUTION**  
    'Initialize?'の設定方法は認証ノードと同様ですが、'Initialize?'のチェックを有効にするノードは、 必ずFlow 画面内で1つとしてください。

    前述のデータ保存ノードと同様の機能を Function ノードで実装する場合は、
    以下のスクリプトを記述します。
    上流ノードから来た msg の payload をそのままバケットに書き込む例です。

        var Nebula = flow.get('Nebula'); 
        var bucket = new Nebula.ObjectBucket('testBucket');
        bucket.save(msg.payload)
            .then(function(robj) {
                node.send({payload: robj});
            })
            .catch (function(error) {
                node.send({payload: error});
            });
        return;  

5. NEC BaaS の Push 送信ノード

    NEC BaaS の管理下にあるクライアント端末に Push 送信するノードです。
    Push 送信ノード(push)の設定ダイアログを開き、以下を設定してください。  
    * 特定の「チャネル」向けに Push 送信したい場合は、 `Channels` 欄に配信先チャネル名を入力してください。  
        例) channel1, channel2, ...
    * 特定の「ユーザ/グループ」向けに Push 送信したい場合は、 `Receivers` 欄に受信者を入力してください。  
        例) user_id, g:group1, g:group2, ...
    * Push 送信するメッセージ内容を `Message` 欄に入力してください。(必須)  
    * `Push Type` 欄で Push 送信方法を選択後、必要に応じて各送信方法の設定値を入力してください。

6. NEC BaaS の API-GW ノード

    NEC BaaS に事前に登録された API (プログラム)を実行するノードです。
    API-GW ノードの設定ダイアログを開き、以下を設定してください。  
    * 実行する API 情報として、 `API Name`, `Method`, `Subpath`, `API Data`　を入力してください。
      本パラメータに対応した API が実行されます。  
    * API 実行のレスポンスをバイナリ(buffer)で受信する場合は、`Response` のチェックを有効にしてください。  
    * `Headers` 欄では API 実行要求時の Header を追加/削除できます。  

補足事項
--------

* NEC BaaS のライブラリ(baas.min.js)の使用

   ノード内のスクリプトからは、 NEC BaaS のライブラリ(baas.min.js)を `Nebula` という名前で参照できるようにしています。  
   例) var Nebula = flow.get('Nebula');  

   NEC BaaS の複数ノード間で NEC BaaS ライブラリのコンテキストを共有するため、
   [Flow context](http://nodered.org/docs/creating-nodes/context) を使用しています。
   Flow context は同一タブ内にあるノード間で共有されます。


* プロキシの設定

    NEC BaaS の各ノードは、 OS に設定された プロキシ情報を使用します。  
    具体的には以下の情報を使用します。(env コマンド実行時に表示される内容)  
      process.env.http_proxy, process.env.https_proxy  

サンプル例
--------
``` 
[{"id":"7172bb4d.641824","type":"inject","z":"27344ed2.1c1ad2","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":177.765625,"y":151.75,"wires":[["34d9592a.77e306"]]},{"id":"fc87e829.e83cf8","type":"comment","z":"27344ed2.1c1ad2","name":"NEC_BaaS_authentication_node","info":"","x":233.765625,"y":101.75,"wires":[]},{"id":"38f024a8.1ec2ec","type":"inject","z":"27344ed2.1c1ad2","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":177.765625,"y":404.75,"wires":[["c29766a8.b58378"]]},{"id":"fd22f992.955588","type":"debug","z":"27344ed2.1c1ad2","name":"debug","active":true,"console":"false","complete":"true","x":637.765625,"y":404.75,"wires":[]},{"id":"beab4612.4589f8","type":"debug","z":"27344ed2.1c1ad2","name":"debug","active":true,"console":"false","complete":"true","x":638.765625,"y":152.75,"wires":[]},{"id":"34d9592a.77e306","type":"auth","z":"27344ed2.1c1ad2","initFlag":true,"name":"auth","nebulaServer":"85bb2f89.58d57","action":"LOGIN","email":"","userName":"","password":"","x":397.5354919433594,"y":152.7017059326172,"wires":[["beab4612.4589f8"]]},{"id":"c29766a8.b58378","type":"object in","z":"27344ed2.1c1ad2","name":"get_object","bucketName":"testBucket","isClause":false,"rules":[{"t":"eq","k":"","v":"","vt":"str"}],"operator":"AND","sortKey":"","sortType":"ASC","skipCount":"","limit":"","projection":"","x":417.5354919433594,"y":404.3409118652344,"wires":[["fd22f992.955588"]]},{"id":"94976ef1.6b03b","type":"inject","z":"27344ed2.1c1ad2","name":"test","topic":"","payload":"{\"name\":\"foo\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":177.765625,"y":278.8409118652344,"wires":[["45d56126.6f977"]]},{"id":"45d56126.6f977","type":"object out","z":"27344ed2.1c1ad2","bucketName":"testBucket","action":"SAVE_OBJECT","createBucket":false,"name":"save_object","x":418.5269775390625,"y":279.15625,"wires":[["42059720.e5bdb8"]]},{"id":"42059720.e5bdb8","type":"debug","z":"27344ed2.1c1ad2","name":"debug","active":true,"console":"false","complete":"true","x":639.7656097412109,"y":278.8409118652344,"wires":[]},{"id":"50017545.01923c","type":"inject","z":"27344ed2.1c1ad2","name":"test","topic":"","payload":"{\"name\":\"bar\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":178.765625,"y":530.8409118652344,"wires":[["c9c41a23.eb8948"]]},{"id":"a77b00b.1c2e1","type":"debug","z":"27344ed2.1c1ad2","name":"debug","active":true,"console":"false","complete":"true","x":637.7656097412109,"y":529.8409118652344,"wires":[]},{"id":"c9c41a23.eb8948","type":"function out","z":"27344ed2.1c1ad2","initFlag":false,"name":"function","nebulaServer":"","func":"var Nebula = flow.get('Nebula'); \nvar bucket = new Nebula.ObjectBucket('testBucket');\nbucket.save(msg.payload)\n    .then(function(robj) {\n        node.send({payload: robj});\n    })\n    .catch (function(error) {\n        node.send({payload: error});\n    });\nreturn;","outputs":1,"noerr":0,"x":406.5326232910156,"y":530.5255432128906,"wires":[["a77b00b.1c2e1"]]},{"id":"b64467ee.391868","type":"comment","z":"27344ed2.1c1ad2","name":"NEC_BaaS_save_object_node","info":"","x":234.765625,"y":225.84091186523438,"wires":[]},{"id":"68e754e4.7011cc","type":"comment","z":"27344ed2.1c1ad2","name":"NEC_BaaS_get_object_node","info":"","x":223.765625,"y":350.8409118652344,"wires":[]},{"id":"8059ee9e.5be55","type":"comment","z":"27344ed2.1c1ad2","name":"NEC_BaaS_function_node","info":"","x":213.765625,"y":473.8409118652344,"wires":[]},{"id":"389497c1.3c5a18","type":"push out","z":"27344ed2.1c1ad2","name":"push","channels":"","receivers":"","message":"","gcm":false,"apns":false,"sse":false,"gcmTitle":"","gcmUri":"","apnsBadge":"","apnsCategory":"","apnsSound":"","sseEventId":"","sseEventType":"","x":395.5298156738281,"y":655.6874694824219,"wires":[["569d503c.84dfd"]]},{"id":"569d503c.84dfd","type":"debug","z":"27344ed2.1c1ad2","name":"debug","active":true,"console":"false","complete":"true","x":639.6661682128906,"y":654.8409423828125,"wires":[]},{"id":"2d6e0a1b.d0ef96","type":"inject","z":"27344ed2.1c1ad2","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":180.6661834716797,"y":655.8409423828125,"wires":[["389497c1.3c5a18"]]},{"id":"ce4c77c8.e64008","type":"comment","z":"27344ed2.1c1ad2","name":"NEC_BaaS_push_node","info":"","x":204.765625,"y":601.8409423828125,"wires":[]},{"id":"d52628d1.d91398","type":"inject","z":"27344ed2.1c1ad2","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":178.1536407470703,"y":781.1944580078125,"wires":[["2a6dbf5c.ec489"]]},{"id":"f2f2c656.622048","type":"debug","z":"27344ed2.1c1ad2","name":"debug","active":true,"console":"false","complete":"true","x":639.1536254882812,"y":780.1944580078125,"wires":[]},{"id":"eee9289c.342008","type":"comment","z":"27344ed2.1c1ad2","name":"NEC_BaaS_apigw_node","info":"","x":214.1536407470703,"y":728.1944580078125,"wires":[]},{"id":"2a6dbf5c.ec489","type":"apigw out","z":"27344ed2.1c1ad2","name":"apigw","apiname":"","method":"","subpath":"","apidata":"","isBinaryResponse":false,"isAddHeaders":false,"rules":[{"k":"","v":"","vt":"str"}],"isClearHeaders":false,"contentType":"","x":394.20921325683594,"y":780.5833740234375,"wires":[["f2f2c656.622048"]]},{"id":"85bb2f89.58d57","type":"nebula-server","z":"27344ed2.1c1ad2","appId":"","appKey":"","tenantId":"","baseUri":""}]
```

以上

　　
　　
　　


