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

  const result = await res.json();
  alert(result.message || "保存しました！");
});
