async function loadSettings() {
  try {
    const res = await fetch("/.netlify/functions/get-settings", { cache: "no-store" });

    if (!res.ok) {
      console.error("get-settings HTTP error:", res.status, res.statusText);
      throw new Error("get-settings failed");
    }

    const data = await res.json();

    // ▼ 営業モードの反映
    const statusText = document.getElementById("status-text");
    if (data.forceClosed) {
      statusText.textContent = "本日は臨時休業です";
    } else {
      statusText.textContent = "通常営業（判定ロジックは後で実装）";
    }

    // ▼ 営業日・営業時間の反映
    const scheduleTable = document.getElementById("schedule-table");
    const dayRow = scheduleTable.rows[1].cells;
    const nightRow = scheduleTable.rows[2].cells;

    if (data.schedule && data.schedule["昼"] && data.schedule["夜"]) {
      data.schedule["昼"].forEach((val, i) => {
        dayRow[i + 1].textContent = val;
      });

      data.schedule["夜"].forEach((val, i) => {
        nightRow[i + 1].textContent = val;
      });
    } else {
      console.warn("schedule data missing:", data.schedule);
    }

    // ▼ お知らせの反映
    const noticeArea = document.getElementById("notice-area");
    if (data.notice && data.notice.enabled) {
      noticeArea.innerHTML = `
        <h3>${data.notice.title}</h3>
        <p>${data.notice.body}</p>
      `;
    } else {
      noticeArea.textContent = "（お知らせはありません）";
    }

  } catch (err) {
    console.error("設定の読み込みに失敗:", err);
    document.getElementById("status-text").textContent = "設定の読み込みに失敗しました";
  }
}

loadSettings();
