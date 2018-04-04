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
* NEC BaaS へデバイス情報を送信するノード
* NEC BaaS からデバイス情報を取得するノード

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

8. NEC BaaS へデバイス情報を送信するノード

    デバイスで発生した情報を NEC BaaS へ送信するノードです。
    デバイス情報送信ノードの設定ダイアログを開き、以下を設定してください。
    * 実行に必要な設定項目として、 `API Name`, `Device ID`, `Device Type`を入力してください。 
    * 送信情報は入力メッセージの `msg.reported`　により指定してください。

9. NEC BaaS からデバイス情報を取得するノード

    NEC BaaS に登録されたデバイスの設定条件が更新された際、更新値を取得するノードです。
    デバイス情報取得ノードの設定ダイアログを開き、以下を設定してください。 
    * 実行に必要な設定項目として、 `API Name`, `Repeat?`, `Device ID`,　`Device Type`を入力してください。
        * `Repeat?`　を有効した場合は、 Long Polling 動作を行います。無効にした場合は 1 回のみ実行します。
    * Polling を停止する場合は、 入力 msg で msg.stopRepeat = ture としてください。
    
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
[{"id":"7e362802.f5b7c8","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":103.89582824707031,"y":99,"wires":[["d54ecef6.355e9"]]},{"id":"56d7c833.c35448","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_authentication_node","info":"","x":159.8958282470703,"y":49,"wires":[]},{"id":"3762dfcb.ff2ef","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":103.89582824707031,"y":352,"wires":[["b312fbd8.861368"]]},{"id":"ba4ac95.545af38","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":563.8958282470703,"y":352,"wires":[]},{"id":"6c94fa30.56ba14","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":564.8958282470703,"y":100,"wires":[]},{"id":"d54ecef6.355e9","type":"auth","z":"942734cf.7e1d68","initFlag":true,"name":"auth","nebulaServer":"c805614.50c93a","action":"LOGIN","x":323.6656951904297,"y":99.95170593261719,"wires":[["6c94fa30.56ba14"]]},{"id":"b312fbd8.861368","type":"object in","z":"942734cf.7e1d68","name":"get_object","bucketName":"testBucket","isClause":false,"rules":[{"t":"eq","k":"","v":"","vt":"str"}],"operator":"AND","sortKey":"","sortType":"ASC","skipCount":"","limit":"","projection":"","x":343.6656951904297,"y":351.5909118652344,"wires":[["ba4ac95.545af38"]]},{"id":"df8073fe.3b748","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{\"name\":\"foo\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":103.89582824707031,"y":226.09091186523438,"wires":[["a93d42fa.6ba5d"]]},{"id":"a93d42fa.6ba5d","type":"object out","z":"942734cf.7e1d68","bucketName":"testBucket","action":"SAVE_OBJECT","createBucket":false,"name":"save_object","x":344.6571807861328,"y":226.40625,"wires":[["bdd137eb.eab238"]]},{"id":"bdd137eb.eab238","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":565.8958129882812,"y":226.09091186523438,"wires":[]},{"id":"8d529608.139d18","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{\"name\":\"bar\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":104.89582824707031,"y":478.0909118652344,"wires":[["7562ddbe.e4e7f4"]]},{"id":"24ce830a.8233dc","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":563.8958129882812,"y":477.0909118652344,"wires":[]},{"id":"7562ddbe.e4e7f4","type":"function out","z":"942734cf.7e1d68","initFlag":false,"name":"function","nebulaServer":"","func":"var Nebula = flow.get('Nebula'); \nvar bucket = new Nebula.ObjectBucket('testBucket');\nbucket.save(msg.payload)\n    .then(function(robj) {\n        node.send({payload: robj});\n    })\n    .catch (function(error) {\n        node.send({payload: error});\n    });\nreturn;","outputs":1,"noerr":0,"x":332.66282653808594,"y":477.7755432128906,"wires":[["24ce830a.8233dc"]]},{"id":"c300f75f.295188","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_save_object_node","info":"","x":160.8958282470703,"y":173.09091186523438,"wires":[]},{"id":"e92022bb.4a1a2","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_get_object_node","info":"","x":149.8958282470703,"y":298.0909118652344,"wires":[]},{"id":"fe7d01b2.5accc","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_function_node","info":"","x":139.8958282470703,"y":421.0909118652344,"wires":[]},{"id":"838c3337.f833a","type":"push out","z":"942734cf.7e1d68","name":"push","channels":"","receivers":"","message":"","gcm":false,"apns":false,"sse":false,"gcmTitle":"","gcmUri":"","apnsBadge":"","apnsCategory":"","apnsSound":"","sseEventId":"","sseEventType":"","x":321.66001892089844,"y":602.9374694824219,"wires":[["df26e353.e8a9c"]]},{"id":"df26e353.e8a9c","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":565.7963714599609,"y":602.0909423828125,"wires":[]},{"id":"7081567c.7d5cd8","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":106.79638671875,"y":603.0909423828125,"wires":[["838c3337.f833a"]]},{"id":"ea029554.9fb8e8","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_push_node","info":"","x":130.8958282470703,"y":549.0909423828125,"wires":[]},{"id":"6f6dc9e0.9e4bf8","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":104.28384399414062,"y":728.4444580078125,"wires":[["ac748bac.c04568"]]},{"id":"93f5a9a8.155e68","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":565.2838287353516,"y":727.4444580078125,"wires":[]},{"id":"a980572f.25db88","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_apigw_node","info":"","x":140.28384399414062,"y":675.4444580078125,"wires":[]},{"id":"ac748bac.c04568","type":"apigw out","z":"942734cf.7e1d68","name":"apigw","apiname":"","method":"","subpath":"","apidata":"","isJsonRequest":false,"isAddHeaders":false,"rules":[{"k":"","v":"","vt":"str"}],"isClearHeaders":false,"contentType":"","isJsonResponse":false,"isBinaryResponse":false,"x":320.33941650390625,"y":727.8333740234375,"wires":[["93f5a9a8.155e68"]]},{"id":"b0522029.b1ff1","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":105,"y":840.3333740234375,"wires":[["aa0be413.2b0018"]]},{"id":"93f0a1ef.de04f","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":565.9999847412109,"y":839.3333740234375,"wires":[]},{"id":"26addd71.168282","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_user_node","info":"","x":131,"y":787.3333740234375,"wires":[]},{"id":"ca1918d8.33d288","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":102.89582824707031,"y":947.888916015625,"wires":[["b3e70d41.99f16"]]},{"id":"26593796.35f718","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":563.8958129882812,"y":946.888916015625,"wires":[]},{"id":"49e4fba5.b767a4","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_send_device_node","info":"","x":158.8958282470703,"y":894.888916015625,"wires":[]},{"id":"1b652631.bfc38a","type":"inject","z":"942734cf.7e1d68","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":103.89582824707031,"y":1056.888916015625,"wires":[["fe525436.882758"]]},{"id":"1684d9e.0bf1d26","type":"debug","z":"942734cf.7e1d68","name":"debug","active":true,"console":"false","complete":"true","x":564.8958129882812,"y":1055.888916015625,"wires":[]},{"id":"7ca506ca.460a68","type":"comment","z":"942734cf.7e1d68","name":"NEC_BaaS_recv_device_node","info":"","x":149.8958282470703,"y":1003.888916015625,"wires":[]},{"id":"aa0be413.2b0018","type":"user in","z":"942734cf.7e1d68","name":"user","action":"GET_CURRENT_USER","userId":"","x":315.9479217529297,"y":838.8819571954235,"wires":[["93f0a1ef.de04f"]]},{"id":"fe525436.882758","type":"device in","z":"942734cf.7e1d68","name":"device","apiname":"device","isRepeat":true,"deviceId":"","deviceType":"","x":311.94447326660156,"y":1057.6840399871642,"wires":[["1684d9e.0bf1d26"]]},{"id":"b3e70d41.99f16","type":"device out","z":"942734cf.7e1d68","name":"device","apiname":"","deviceId":"","deviceType":"","x":314.95140075683594,"y":946.9028205047423,"wires":[["26593796.35f718"]]},{"id":"3f84d991.aeca76","type":"inject","z":"942734cf.7e1d68","name":"stop repeat","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":114.89582824707031,"y":1116.77783203125,"wires":[["6679f035.d7cd8"]]},{"id":"6679f035.d7cd8","type":"function out","z":"942734cf.7e1d68","initFlag":false,"name":"function","nebulaServer":"","func":"\nmsg.stopRepeat = true;\n\nreturn msg;","outputs":1,"noerr":0,"x":318.9409637451172,"y":1116.6458740234375,"wires":[["fe525436.882758"]]},{"id":"c805614.50c93a","type":"nebula-server","z":"942734cf.7e1d68","tenantId":"","baseUri":""}]
```

以上

　　
　　
　　


