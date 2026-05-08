// ▼ 初期読み込み（get-settings → UI に反映）
async function loadSettingsToUI() {
  const res = await fetch("/.netlify/functions/get-settings");
  const data = await res.json();

  // 営業モード
  document.querySelector(`input[name='forceClosed'][value='${data.forceClosed ? "closed" : "open"}']`).checked = true;

  // 昼
  const dayRow = document.querySelectorAll(".settings-table tr")[1].querySelectorAll("select");
  data.schedule["昼"].forEach((val, i) => {
    dayRow[i].value = val;
  });

  // 夜
  const nightRow = document.querySelectorAll(".settings-table tr")[2].querySelectorAll("select");
  data.schedule["夜"].forEach((val, i) => {
    nightRow[i].value = val;
  });

  // お知らせ
  document.getElementById("noticeEnabled").checked = data.notice.enabled;
  document.querySelector(".notice-title").value = data.notice.title;
  document.querySelector(".notice-body").value = data.notice.body;
}

loadSettingsToUI();


// ▼ 保存処理
document.querySelector(".settings-save-btn").addEventListener("click", async () => {
  const forceClosed = document.querySelector("input[name='forceClosed']:checked").value === "closed";

  // 営業日（昼・夜）
  const rows = document.querySelectorAll(".settings-table tr");
  const schedule = { "昼": [], "夜": [] };

  // 昼（2行目）
  const dayRow = rows[1].querySelectorAll("select");
  dayRow.forEach(sel => schedule["昼"].push(sel.value));

  // 夜（3行目）
  const nightRow = rows[2].querySelectorAll("select");
  nightRow.forEach(sel => schedule["夜"].push(sel.value));

  // お知らせ
  const noticeEnabled = document.getElementById("noticeEnabled").checked;
  const noticeTitle = document.querySelector(".notice-title").value;
  const noticeBody = document.querySelector(".notice-body").value;

  const payload = {
    forceClosed,
    schedule,
    notice: {
      enabled: noticeEnabled,
      title: noticeTitle,
      body: noticeBody
    }
  };

  const res = await fetch("/.netlify/functions/save-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // ▼ 修正ポイント（ここだけ変えた）
  const data = await res.json();
  const msg = Object.keys(data)[0];  // 最初のキー名を取得
  alert(msg);  // → 「設定内容を更新しました！」だけが表示される
});
