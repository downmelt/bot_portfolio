# Kalabi-Yau

Kalabi-Yauはブログを運営するグループで行っている作業の自動化や、活動する上での便利機能を実装するために制作されたTwitter及びDiscord用のbotです。

このbotはグループ内で使用することを目的として制作したため、他DiscordサーバーやTwitterアカウントでの使用は想定していません。

## 機能

### Discord

#### 時報

毎朝8時にDiscordチャットに時報を伝える機能です。

時報の内容は、"日付"、"曜日"、"前日のブログのpv数"、"ブログのpv数の先週比"をベースとして、その日が休日である場合は休日である旨を、祝日である場合はその祝日の名称を表示します。

また、月曜日には"先週のブログの総pv数"と"総pv数の先々週比"を追加で表示します。

#### 定期集会の告知チャット

毎週土曜日の20時に定期集会の告知チャットをする機能です。

参加意思をわかりやすくするために、メンバーがメッセージに対してリアクションを付けると、メッセージの末尾にメンバーのアバターの顔のスタンプが追加される機能も備えています。

#### roleの自動付与機能

ブログに記事を投稿したメンバーに役職"ブロガー"を自動で付与したり、固定メッセージに特定のリアクションをしたメンバーに役職"Develop"や"emoji"を付与する機能です。

ブロガーは記事の最終投稿日から30日経つと自動で剥奪されます。

#### 現在時刻の確認機能(!now)

コマンド「!now」がチャットに送られると現在時刻を返す機能です。

#### サイコロ機能(!dice arg1 arg2)

コマンド「!dice」がチャットに送られるとサイコロの結果を返す機能です。

複数回振る場合は、サイコロの目の合計を返します。

##### arg1

サイコロの最大値を指定する引数です。範囲は1以上。

##### arg2

サイコロを振る回数を指定する機能です。範囲は1以上。

#### 投票機能(!poll arg1 arg2...)

コマンド「!poll」がチャットに送られると引数に沿った投票メッセージを生成する機能です。

メンバーがリアクションで投票すると、選択肢の末尾にアバターの顔のスタンプが追加されます。

##### 引数

!pollの後に引数の指定子と内容をセットで指定します。引数は空白やtab、改行で区切られている必要があります。また、引数に空白や改行を含めたい場合は「""」(ダブルクォーテーション)で囲う必要があります。

例：
```
!poll -t "キャンプ 集合時間"
-l "30:00"
-s :one: -o "12:00"
-s :two: -o "12:30"
-s :three: -o "13:00"
-s :four: -o "13:30"
```

###### -t

タイトルを指定する。

###### -l

制限時間をタイマー方式(残り時間)で指定する。  
形式 : "YYYY/MM/DD HH:mm:SS"

###### -d

制限時間をアラーム方式(終了する時刻)で指定する。  
形式 : "YYYY/MM/DD HH:mm:SS"

###### -s

選択肢のスタンプを指定する。

###### -o

選択肢の内容を指定する。

### Twitter

#### ブログ記事の自動RT

メンバーがブログのURLリンクを含むツイートをした場合、自動でリツイートする機能です。

#### 新規記事の自動告知ツイート

ブログに新規記事が投稿された場合、20時にライター名とタイトルをURLリンク付きで自動ツイートします。

例:  
〘〇〇の新規記事〙  
【タイトル】タイトルタイトルタイトルタイトルタイトル【タイトル】  
blog.com/url

## 使用ライブラリ

### Python

・tweepy
・Beutiful Soup 4
・Requests
・google-api-python-client

### JavaScript

・Node.js
・Discord.js
・japanese-holidays-js
