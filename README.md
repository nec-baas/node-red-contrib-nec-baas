node-red-contrib-nec-baas 
===============

本モジュールは、 Node-RED 上で NEC モバイルバックエンド基盤(以下、NEC BaaS)にアクセスする機能を提供します。

提供する機能
------------

提供する機能(ノード)は以下のとおりです。
* NEC BaaS への認証(パスワード認証/クライアント証明書認証)に使用するノード
* NEC BaaS のオブジェクトストレージからデータ取得するノード
* NEC BaaS のオブジェクトストレージへデータを保存するノード
* NEC BaaS が提供する様々な機能を JavaScript で記述できるノード
* NEC BaaS の管理下にあるクライアント端末に Push 送信するノード
* NEC BaaS に登録された API (プログラム)を実行するノード
* NEC BaaS からユーザ情報を取得するノード

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

    NEC BaaS への認証(パスワード認証/クライアント証明書認証)に使用するノードです。
    認証ノード(auth)の設定ダイアログを開き、以下を設定してください。
    * `Initialize?` をチェック後、接続先の`NEC BaaS サーバ`情報を `Config` 欄に設定します。
    * パスワード認証を行う場合は、 `Action` 欄を `login` としてください。
    * パスワード認証に必要なアカウント情報を `Email`　(または `User`), `Password` 欄に入力してください。
    * クライアント証明書認証を行う場合は、 `Action` 欄を `Use Client Cert authentication` とした後、クライアント証明書のファイルパスを入力してください。

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

7. NEC BaaS からユーザ情報を取得するノード

    NEC BaaS に登録されたユーザ情報を取得するノードです。
    ユーザ取得ノードの設定ダイアログを開き、以下を設定してください。
    * 操作内容を以下から選択してください。
        * ログイン中のユーザ取得 / ユーザ ID によるユーザ取得 / 全てのユーザ取得
        * 上記でユーザ ID によるユーザ取得を選択した場合は、対象のユーザ ID を入力してください。 

補足事項
--------

* NEC BaaS のライブラリ(baas.min.js)の使用

   NEC BaaS の Function ノード内のスクリプトからは、 NEC BaaS のライブラリ(baas.min.js)を以下のようにすることで参照できます。  
   例) var Nebula = flow.get('Nebula'); または、 var Nebula = nebula.get();

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
[{"id":"8888999c.32b398","type":"inject","z":"a45eb688.696048","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":123.5078125,"y":100,"wires":[["388c4475.57657c"]]},{"id":"2b1b3548.60ffda","type":"comment","z":"a45eb688.696048","name":"NEC_BaaS_authentication_node","info":"","x":179.5078125,"y":50,"wires":[]},{"id":"77d6301d.48af2","type":"inject","z":"a45eb688.696048","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":123.5078125,"y":353,"wires":[["9a8751f1.a0057"]]},{"id":"a4ada935.11d5c8","type":"debug","z":"a45eb688.696048","name":"debug","active":true,"console":"false","complete":"true","x":583.5078125,"y":353,"wires":[]},{"id":"9c85cf1c.9fab","type":"debug","z":"a45eb688.696048","name":"debug","active":true,"console":"false","complete":"true","x":584.5078125,"y":101,"wires":[]},{"id":"388c4475.57657c","type":"auth","z":"a45eb688.696048","initFlag":true,"name":"auth","nebulaServer":"12772ca.29f28d3","action":"LOGIN","x":343.2776794433594,"y":100.95170593261719,"wires":[["9c85cf1c.9fab"]]},{"id":"9a8751f1.a0057","type":"object in","z":"a45eb688.696048","name":"get_object","bucketName":"testBucket","isClause":false,"rules":[{"t":"eq","k":"","v":"","vt":"str"}],"operator":"AND","sortKey":"","sortType":"ASC","skipCount":"","limit":"","projection":"","x":363.2776794433594,"y":352.5909118652344,"wires":[["a4ada935.11d5c8"]]},{"id":"30fac9ef.aabb36","type":"inject","z":"a45eb688.696048","name":"test","topic":"","payload":"{\"name\":\"foo\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":123.5078125,"y":227.09091186523438,"wires":[["1400ab00.729b25"]]},{"id":"1400ab00.729b25","type":"object out","z":"a45eb688.696048","bucketName":"testBucket","action":"SAVE_OBJECT","createBucket":false,"name":"save_object","x":364.2691650390625,"y":227.40625,"wires":[["6150d8ec.0bf818"]]},{"id":"6150d8ec.0bf818","type":"debug","z":"a45eb688.696048","name":"debug","active":true,"console":"false","complete":"true","x":585.5077972412109,"y":227.09091186523438,"wires":[]},{"id":"b6f78721.81ed98","type":"inject","z":"a45eb688.696048","name":"test","topic":"","payload":"{\"name\":\"bar\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":124.5078125,"y":479.0909118652344,"wires":[["ee234281.e440c"]]},{"id":"e3e639dd.432f68","type":"debug","z":"a45eb688.696048","name":"debug","active":true,"console":"false","complete":"true","x":583.5077972412109,"y":478.0909118652344,"wires":[]},{"id":"ee234281.e440c","type":"function out","z":"a45eb688.696048","initFlag":false,"name":"function","nebulaServer":"","func":"var Nebula = flow.get('Nebula'); \nvar bucket = new Nebula.ObjectBucket('testBucket');\nbucket.save(msg.payload)\n    .then(function(robj) {\n        node.send({payload: robj});\n    })\n    .catch (function(error) {\n        node.send({payload: error});\n    });\nreturn;","outputs":1,"noerr":0,"x":352.2748107910156,"y":478.7755432128906,"wires":[["e3e639dd.432f68"]]},{"id":"a57888ca.dbe3e8","type":"comment","z":"a45eb688.696048","name":"NEC_BaaS_save_object_node","info":"","x":180.5078125,"y":174.09091186523438,"wires":[]},{"id":"27b1e922.07a8b6","type":"comment","z":"a45eb688.696048","name":"NEC_BaaS_get_object_node","info":"","x":169.5078125,"y":299.0909118652344,"wires":[]},{"id":"cb01698a.f76f48","type":"comment","z":"a45eb688.696048","name":"NEC_BaaS_function_node","info":"","x":159.5078125,"y":422.0909118652344,"wires":[]},{"id":"84e07943.b98518","type":"push out","z":"a45eb688.696048","name":"push","channels":"","receivers":"","message":"","gcm":false,"apns":false,"sse":false,"gcmTitle":"","gcmUri":"","apnsBadge":"","apnsCategory":"","apnsSound":"","sseEventId":"","sseEventType":"","x":341.2720031738281,"y":603.9374694824219,"wires":[["7a654a7d.1882b4"]]},{"id":"7a654a7d.1882b4","type":"debug","z":"a45eb688.696048","name":"debug","active":true,"console":"false","complete":"true","x":585.4083557128906,"y":603.0909423828125,"wires":[]},{"id":"9ba9bac5.cb72c8","type":"inject","z":"a45eb688.696048","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":126.40837097167969,"y":604.0909423828125,"wires":[["84e07943.b98518"]]},{"id":"a190dafd.b64cb8","type":"comment","z":"a45eb688.696048","name":"NEC_BaaS_push_node","info":"","x":150.5078125,"y":550.0909423828125,"wires":[]},{"id":"7de384f5.b79c7c","type":"inject","z":"a45eb688.696048","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":123.89582824707031,"y":729.4444580078125,"wires":[["ece1dd8.1e3962"]]},{"id":"86089ea7.237e8","type":"debug","z":"a45eb688.696048","name":"debug","active":true,"console":"false","complete":"true","x":584.8958129882812,"y":728.4444580078125,"wires":[]},{"id":"80c3ccf2.3d8db","type":"comment","z":"a45eb688.696048","name":"NEC_BaaS_apigw_node","info":"","x":159.8958282470703,"y":676.4444580078125,"wires":[]},{"id":"ece1dd8.1e3962","type":"apigw out","z":"a45eb688.696048","name":"apigw","apiname":"","method":"","subpath":"","apidata":"","isJsonRequest":false,"isAddHeaders":false,"rules":[{"k":"","v":"","vt":"str"}],"isClearHeaders":false,"contentType":"","isJsonResponse":false,"isBinaryResponse":false,"x":339.95140075683594,"y":728.8333740234375,"wires":[["86089ea7.237e8"]]},{"id":"e7faaf35.644d4","type":"inject","z":"a45eb688.696048","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":124.61198425292969,"y":841.3333740234375,"wires":[["c0ea18e4.6de8c8"]]},{"id":"4bd856a3.a7ef08","type":"debug","z":"a45eb688.696048","name":"debug","active":true,"console":"false","complete":"true","x":585.6119689941406,"y":840.3333740234375,"wires":[]},{"id":"3aa99528.1074da","type":"comment","z":"a45eb688.696048","name":"NEC_BaaS_user_node","info":"","x":150.6119842529297,"y":788.3333740234375,"wires":[]},{"id":"c0ea18e4.6de8c8","type":"user in","z":"a45eb688.696048","name":"user","action":"GET_CURRENT_USER","userId":"","x":335.5599060058594,"y":839.8819571954235,"wires":[["4bd856a3.a7ef08"]]},{"id":"12772ca.29f28d3","type":"nebula-server","z":"a45eb688.696048","tenantId":"","baseUri":""}]
```

以上

　　
　　
　　


