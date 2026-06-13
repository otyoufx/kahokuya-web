function checkMail() {
  const props = PropertiesService.getScriptProperties();

  // ▼ 前回処理したメールの日時（ISO文字列）
  const lastTime = props.getProperty("lastMailTime");
  const lastBody = props.getProperty("lastMailBody");

  // ▼ 最新メールを1件だけ取得（全件検索しない）
  const threads = GmailApp.search("from:xxx@example.com", 0, 1);
  if (threads.length === 0) {
    Logger.log("メールなし");
    return;
  }

  const msg = threads[0].getMessages().pop();
  const mailDate = msg.getDate().toISOString();
  const mailBody = msg.getPlainBody().trim();

  // ▼ 差分チェック：日時も本文も前回と同じならスキップ
  if (lastTime === mailDate && lastBody === mailBody) {
    Logger.log("No new mail. Skip.");
    return;
  }

  // ▼ Netlify に送信
  const payload = {
    from: msg.getFrom(),
    subject: msg.getSubject(),
    body: mailBody
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const url = "https://kahokuya.netlify.app/.netlify/functions/update-news";
  const res = UrlFetchApp.fetch(url, options);

  Logger.log("Netlify response: " + res.getContentText());

  // ▼ 成功したら最新情報を保存
  props.setProperty("lastMailTime", mailDate);
  props.setProperty("lastMailBody", mailBody);
}
