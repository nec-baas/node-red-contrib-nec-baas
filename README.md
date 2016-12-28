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
    * ログイン認証に必要なアカウント情報を `Email, User, Password` 欄に入力してください。
   
2. NEC BaaS のデータ保存ノード

    NEC BaaS のオブジェクトストレージへデータを保存するノードです。
    データ保存ノード(object)の設定ダイアログを開き、以下を設定してください。  
    * `Bucket Name` 欄に Bucket 名を入力してください。

3. NEC BaaS のデータ取得ノード

    NEC BaaS のオブジェクトストレージからデータを取得するノードです。
    データ取得ノード(object)の設定ダイアログを開き、以下を設定してください。  
    * `Bucket Name` 欄に Bucket 名を入力してください。
    * 全てのオブジェクトデータを取得する場合は、 `Initialize?` をチェックします。
    * 検索条件を指定する場合は、 `Initialize?` のチェックを外して条件式を入力してください。
　　　
4. NEC BaaS の Function ノード

    NEC BaaS が提供する様々な機能(詳細なロジック等)を JavaScript で記述できるノードです。
    'Initialize?'のチェックを無効にして、 `Function` 欄 に 実行するスクリプトを記述します。
   
    **CAUTION**  
    'Initialize?'のチェックを有効にするのは、 Flow 画面内で必ず1つとしてください。

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
[{"id":"9bbe2cf7.d24cf","type":"inject","z":"4af4bb20.a71824","name":"input","topic":"","payload":"{\"email\":\"foo@test.com\",\"password\":\"password\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":134.0994415283203,"y":122,"wires":[["9694cd9f.53a14"]]},{"id":"a83d1977.4d2778","type":"comment","z":"4af4bb20.a71824","name":"NEC BaaS authentication node","info":"","x":162.0994415283203,"y":65,"wires":[]},{"id":"7701a7d7.85fe08","type":"inject","z":"4af4bb20.a71824","name":"test","topic":"","payload":"{}","payloadType":"json","repeat":"","crontab":"","once":false,"x":134.0994415283203,"y":378,"wires":[["fde44ad0.0fa578"]]},{"id":"3f51b160.0d314e","type":"debug","z":"4af4bb20.a71824","name":"debug","active":true,"console":"false","complete":"true","x":603.0994415283203,"y":378,"wires":[]},{"id":"9a8b0161.d14e","type":"debug","z":"4af4bb20.a71824","name":"debug","active":true,"console":"false","complete":"true","x":604.0994415283203,"y":123,"wires":[]},{"id":"9694cd9f.53a14","type":"auth","z":"4af4bb20.a71824","initFlag":true,"name":"auth","nebulaServer":"1e3bce8c.cde141","action":"LOGIN","email":"","userName":"","password":"","x":353.8693084716797,"y":122.95170593261719,"wires":[["9a8b0161.d14e"]]},{"id":"fde44ad0.0fa578","type":"object in","z":"4af4bb20.a71824","name":"get object","bucketName":"testBucket","noClause":true,"rules":[{"t":"eq","k":"","v":"","vt":"str"}],"operator":"AND","sortKey":"","sortType":"ASC","projection":"","x":362.8693084716797,"y":377.5909118652344,"wires":[["3f51b160.0d314e"]]},{"id":"61571ae.d88d7e4","type":"inject","z":"4af4bb20.a71824","name":"test","topic":"","payload":"{\"name\":\"foo\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":134.0994415283203,"y":255.09091186523438,"wires":[["3d5f692d.334416"]]},{"id":"3d5f692d.334416","type":"object out","z":"4af4bb20.a71824","bucketName":"testBucket","action":"SAVE_OBJECT","createBucket":false,"name":"save object","x":372.8607940673828,"y":255.40625,"wires":[["1339f040.d08f"]]},{"id":"1339f040.d08f","type":"debug","z":"4af4bb20.a71824","name":"debug","active":true,"console":"false","complete":"true","x":605.0994262695312,"y":255.09091186523438,"wires":[]},{"id":"8793c3a6.04d1d","type":"inject","z":"4af4bb20.a71824","name":"test","topic":"","payload":"{\"name\":\"bar\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":135.0994415283203,"y":504.0909118652344,"wires":[["dcfaaaf2.c26a58"]]},{"id":"1c936168.6a73cf","type":"debug","z":"4af4bb20.a71824","name":"debug","active":true,"console":"false","complete":"true","x":603.0994262695312,"y":503.0909118652344,"wires":[]},{"id":"dcfaaaf2.c26a58","type":"function out","z":"4af4bb20.a71824","initFlag":false,"name":"function","nebulaServer":"","func":"var Nebula = flow.get('Nebula'); \nvar bucket = new Nebula.ObjectBucket('testBucket');\nbucket.save(msg.payload)\n    .then(function(robj) {\n        node.send({payload: robj});\n    })\n    .catch (function(error) {\n        node.send({payload: error});\n    });\nreturn;","outputs":1,"noerr":0,"x":362.86643981933594,"y":503.7755432128906,"wires":[["1c936168.6a73cf"]]},{"id":"abbcfa34.200348","type":"comment","z":"4af4bb20.a71824","name":"NEC BaaS save-object node","info":"","x":151.0994415283203,"y":202.09091186523438,"wires":[]},{"id":"a08b7fb2.cfaa6","type":"comment","z":"4af4bb20.a71824","name":"NEC BaaS get-object node","info":"","x":140.0994415283203,"y":325.0909118652344,"wires":[]},{"id":"18867938.880137","type":"comment","z":"4af4bb20.a71824","name":"NEC BaaS function node","info":"","x":140.0994415283203,"y":451.0909118652344,"wires":[]},{"id":"1e3bce8c.cde141","type":"nebula-server","z":"4af4bb20.a71824","appId":"","appKey":"","tenantId":"","baseUri":""}]
```

以上

　　
　　
　　


