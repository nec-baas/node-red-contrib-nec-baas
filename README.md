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
* NEC BaaS の SSE Push サーバから Push 受信するノード
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
    * Push 送信するメッセージ内容を `Message` 欄に入力してください。  
    * `Push Type` 欄で Push 送信方法を選択後、必要に応じて各送信方法の設定値を入力してください。

6. NEC BaaS の Push 受信ノード

    NEC BaaS の SSE Push サーバから Push 受信するノードです。
    Push 受信ノード(push)の設定ダイアログを開き、以下を設定してください。
    * 特定の「チャネル」向けの Push を受信したい場合は、 `Channels` 欄にチャネル名を入力してください。  
        例) channel1, channel2, ...
    * 特定の「ユーザ/グループ」からの Push を受信したい場合は、 `Senders` 欄に送信者を入力してください。  
        例) user_id, g:group1, g:group2, ...
    * Push 受信デバイスを一意に特定できる値( UUID 等)を ` Device Token` 欄に入力してください。   
    
7. NEC BaaS の API-GW ノード

    NEC BaaS に事前に登録された API (プログラム)を実行するノードです。
    API-GW ノードの設定ダイアログを開き、以下を設定してください。
    * 実行する API 情報として、 `API Name`, `Method`, `Subpath`, `API Data`　を入力してください。
      本パラメータに対応した API が実行されます。  
    * API 実行のレスポンスをバイナリ(buffer)で受信する場合は、`Response` のチェックを有効にしてください。  
    * `Headers` 欄では API 実行要求時の Header を追加/削除できます。  

8. NEC BaaS からユーザ情報を取得するノード

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
[{"id":"d1efd479.e596a8","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":132.5078125,"y":104.5234375,"wires":[["c33d2cf2.66e4c"]]},{"id":"2f16f338.ebb43c","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_authentication_node","info":"","x":188.5078125,"y":54.5234375,"wires":[]},{"id":"bb19b897.8ca068","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":132.5078125,"y":340.5234375,"wires":[["45e0bfff.c83dd"]]},{"id":"4f05a795.a373e8","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":592.5078125,"y":340.5234375,"wires":[]},{"id":"77c6cc41.2f99c4","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":593.5078125,"y":105.5234375,"wires":[]},{"id":"c33d2cf2.66e4c","type":"auth","z":"f3a635b0.94a3e8","initFlag":true,"name":"auth","nebulaServer":"e9c21a4.1b59be8","action":"LOGIN","x":352.2776794433594,"y":105.47514343261719,"wires":[["77c6cc41.2f99c4"]]},{"id":"45e0bfff.c83dd","type":"object in","z":"f3a635b0.94a3e8","name":"get_object","bucketName":"testBucket","isClause":false,"rules":[{"t":"eq","k":"","v":"","vt":"str"}],"operator":"AND","sortKey":"","sortType":"ASC","skipCount":"","limit":"","projection":"","x":372.2776794433594,"y":340.1143493652344,"wires":[["4f05a795.a373e8"]]},{"id":"aa83628b.01768","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{\"name\":\"foo\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":132.5078125,"y":220.61434936523438,"wires":[["9df171cf.8273d"]]},{"id":"9df171cf.8273d","type":"object out","z":"f3a635b0.94a3e8","bucketName":"testBucket","action":"SAVE_OBJECT","createBucket":false,"name":"save_object","x":373.2691650390625,"y":220.9296875,"wires":[["13da7f44.7f83b1"]]},{"id":"13da7f44.7f83b1","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":594.5077972412109,"y":220.61434936523438,"wires":[]},{"id":"c1cb5f2a.73c33","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{\"name\":\"bar\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":133.5078125,"y":466.6143493652344,"wires":[["1efb419f.b51f6e"]]},{"id":"ea3a7395.2aad6","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":592.5077972412109,"y":465.6143493652344,"wires":[]},{"id":"1efb419f.b51f6e","type":"function out","z":"f3a635b0.94a3e8","initFlag":false,"name":"function","nebulaServer":"","func":"var Nebula = flow.get('Nebula'); \nvar bucket = new Nebula.ObjectBucket('testBucket');\nbucket.save(msg.payload)\n    .then(function(robj) {\n        node.send({payload: robj});\n    })\n    .catch (function(error) {\n        node.send({payload: error});\n    });\nreturn;","outputs":1,"noerr":0,"x":361.2748107910156,"y":466.2989807128906,"wires":[["ea3a7395.2aad6"]]},{"id":"5ef749c7.9ea428","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_save_object_node","info":"","x":179.5078125,"y":167.61434936523438,"wires":[]},{"id":"dd630522.a9d0f8","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_get_object_node","info":"","x":178.5078125,"y":286.6143493652344,"wires":[]},{"id":"4f2cf79f.e36318","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_function_node","info":"","x":168.5078125,"y":409.6143493652344,"wires":[]},{"id":"68e0bf60.b9a2a","type":"push out","z":"f3a635b0.94a3e8","name":"push","channels":"","receivers":"","message":"","gcm":false,"apns":false,"sse":false,"gcmTitle":"","gcmUri":"","apnsBadge":"","apnsCategory":"","apnsSound":"","sseEventId":"","sseEventType":"","x":350.2720031738281,"y":591.4609069824219,"wires":[["b9182f41.adc8c"]]},{"id":"b9182f41.adc8c","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":594.4083557128906,"y":590.6143798828125,"wires":[]},{"id":"d1998adc.356778","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":135.4083709716797,"y":591.6143798828125,"wires":[["68e0bf60.b9a2a"]]},{"id":"f88b22bf.5a05f","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_push_send_node","info":"","x":178.5078125,"y":537.6143798828125,"wires":[]},{"id":"49d107a7.bdf9f8","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":131.8958282470703,"y":842.9678955078125,"wires":[["3e0ed086.e24b5"]]},{"id":"f4089970.03ec78","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":592.8958129882812,"y":841.9678955078125,"wires":[]},{"id":"74f8c067.efcd5","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_apigw_node","info":"","x":154.8958282470703,"y":789.9678955078125,"wires":[]},{"id":"3e0ed086.e24b5","type":"apigw out","z":"f3a635b0.94a3e8","name":"apigw","apiname":"","method":"GET","subpath":"","apidata":"","isJsonRequest":false,"isAddHeaders":false,"rules":[{"k":"","v":"","vt":"str"}],"isClearHeaders":false,"contentType":"","isJsonResponse":false,"isBinaryResponse":false,"x":347.95140075683594,"y":842.3568115234375,"wires":[["f4089970.03ec78"]]},{"id":"adf6902a.f67cd","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":128.6119842529297,"y":965.8568115234375,"wires":[["6fce9b28.3a16a4"]]},{"id":"34a86bb0.4faea4","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":589.6119689941406,"y":964.8568115234375,"wires":[]},{"id":"405093b4.6b112c","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_user_node","info":"","x":154.6119842529297,"y":912.8568115234375,"wires":[]},{"id":"6fce9b28.3a16a4","type":"user in","z":"f3a635b0.94a3e8","name":"user","action":"GET_CURRENT_USER","userId":"","x":347.5599060058594,"y":964.4053946954235,"wires":[["34a86bb0.4faea4"]]},{"id":"b9a4bd23.f7cc6","type":"inject","z":"f3a635b0.94a3e8","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":133.5078125,"y":715.5234375,"wires":[["dbcc864a.e16fb8"]]},{"id":"78632525.fcdd1c","type":"debug","z":"f3a635b0.94a3e8","name":"debug","active":true,"console":"false","complete":"true","x":594.5077972412109,"y":714.5234375,"wires":[]},{"id":"d6929e37.3b037","type":"comment","z":"f3a635b0.94a3e8","name":"NEC_BaaS_push_recv_node","info":"","x":176.5078125,"y":662.5234375,"wires":[]},{"id":"dbcc864a.e16fb8","type":"push in","z":"f3a635b0.94a3e8","name":"push","channels":"","senders":"","deviceToken":"11111111-2222-3333-4444-555555555555","x":351.2421875,"y":714.71875,"wires":[["78632525.fcdd1c"]]},{"id":"e9c21a4.1b59be8","type":"nebula-server","z":"f3a635b0.94a3e8","tenantId":"","baseUri":""}]
```

以上

　　
　　
　　


