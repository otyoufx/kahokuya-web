// main.js
// 新仕様：曜日 × 昼夜 × openMark + enabled + start/end
// ・営業状況判定
// ・◯✕テーブル更新
// ・平日/土曜/日曜/祝日/定休日テキスト生成

// ▼ 時刻文字列 "HH:MM" → 分に変換
function toMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// ▼ 分 → "HH:MM"
function toTimeString(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// ▼ 祝日判定（holidays.json を fetch）
async function isHoliday(date) {
  try {
    const res = await fetch("/holidays.json", { cache: "no-store" });
    if (!res.ok) throw new Error("holidays load failed");
    const holidays = await res.json();

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;

    return holidays.includes(key);
  } catch (e) {
    console.error("祝日判定エラー:", e);
    return false;
  }
}

// ▼ 営業状況を更新
async function updateBusinessStatus() {
  const data = window.__settings;
  if (!data) return;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const time = `${hh}:${mm}`;

  // 日付表示
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const nowTimeEl = document.getElementById("now-time");
  if (nowTimeEl) {
    nowTimeEl.textContent = `只今の日時：${y}/${m}/${d} ${hh}:${mm}`;
  }

  const statusEl = document.getElementById("now-status");
  if (!statusEl) return;

  // ① 臨時休業が最優先
  if (data.forceClosed) {
    statusEl.textContent = "本日は臨時休業です";
    return;
  }

  // ② 祝日判定
  const holiday = await isHoliday(now);

  // ③ 曜日キー
  const weekKeys = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayKey = holiday ? "holiday" : weekKeys[now.getDay()];

  const schedule = data.schedule[dayKey];
  if (!schedule) {
    statusEl.textContent = "営業時間データなし";
    return;
  }

  // ④ 昼・夜の判定
  const slots = ["day", "night"];
  let isOpen = false;

  for (const slot of slots) {
    const s = schedule[slot];
    if (!s) continue;

    if (s.openMark !== "◯") continue;
    if (!s.enabled) continue;
    if (!s.start || !s.end) continue;

    const start = s.start;
    const end = s.end;

    if (time >= start && time <= end) {
      isOpen = true;
      break;
    }
  }

  statusEl.textContent = isOpen ? "営業中です。" : "営業時間外です。";
}

// ▼ ◯✕テーブルを更新
function updateScheduleTable() {
  const data = window.__settings;
  if (!data) return;

  const table = document.querySelector(".schedule-table");
  if (!table || !table.rows[1] || !table.rows[2]) return;

  const dayRow = table.rows[1].cells;
  const nightRow = table.rows[2].cells;

  const weekKeys = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

  weekKeys.forEach((key, i) => {
    const day = data.schedule[key]?.day;
    const night = data.schedule[key]?.night;

    dayRow[i + 1].textContent = day ? (day.openMark || "") : "";
    nightRow[i + 1].textContent = night ? (night.openMark || "") : "";
  });
}

// ▼ 平日（月〜金）の時間帯レンジを算出
function buildWeekdayRange(data, slot) {
  const days = ["monday","tuesday","wednesday","thursday","friday"];

  let minStart = null;
  let maxEnd = null;

  for (const key of days) {
    const s = data.schedule[key]?.[slot];
    if (!s) continue;

    if (s.openMark !== "◯") continue;
    if (!s.enabled) continue;
    if (!s.start || !s.end) continue;

    let st = toMinutes(s.start);
    let ed = toMinutes(s.end);
    if (st == null || ed == null) continue;

    if (slot === "day") {
      const minLimit = toMinutes("11:00");
      const maxLimit = toMinutes("15:00");
      if (ed <= minLimit || st >= maxLimit) continue;
      st = Math.max(st, minLimit);
      ed = Math.min(ed, maxLimit);
    } else {
      const minLimit = toMinutes("17:00");
      const maxLimit = toMinutes("22:00");
      if (ed <= minLimit || st >= maxLimit) continue;
      st = Math.max(st, minLimit);
      ed = Math.min(ed, maxLimit);
    }

    if (minStart === null || st < minStart) minStart = st;
    if (maxEnd === null || ed > maxEnd) maxEnd = ed;
  }

  if (minStart === null || maxEnd === null) return null;
  return {
    start: toTimeString(minStart),
    end: toTimeString(maxEnd),
  };
}

// ▼ 単一曜日（土曜・日曜・祝日）の時間帯を取得
function buildSingleDayRange(slotData, slotType) {
  if (!slotData) return null;
  if (slotData.openMark !== "◯") return null;
  if (!slotData.enabled) return null;
  if (!slotData.start || !slotData.end) return null;

  let st = toMinutes(slotData.start);
  let ed = toMinutes(slotData.end);
  if (st == null || ed == null) return null;

  if (slotType === "day") {
    const minLimit = toMinutes("11:00");
    const maxLimit = toMinutes("15:00");
    if (ed <= minLimit || st >= maxLimit) return null;
    st = Math.max(st, minLimit);
    ed = Math.min(ed, maxLimit);
  } else {
    const minLimit = toMinutes("17:00");
    const maxLimit = toMinutes("22:00");
    if (ed <= minLimit || st >= maxLimit) return null;
    st = Math.max(st, minLimit);
    ed = Math.min(ed, maxLimit);
  }

  return {
    start: toTimeString(st),
    end: toTimeString(ed),
  };
}

// ▼ 営業日・営業時間テキストを更新
function updateBusinessText() {
  const data = window.__settings;
  if (!data) return;

  const container = document.getElementById("business-text");
  if (!container) return;

  let html = "";

  // ■ 平日
  const weekdayDay = buildWeekdayRange(data, "day");
  const weekdayNight = buildWeekdayRange(data, "night");

  if (weekdayDay || weekdayNight) {
    html += `<strong>【平日】</strong><br>`;
    if (weekdayDay) {
      html += `　ランチ：${weekdayDay.start}〜${weekdayDay.end}<br>`;
    }
    if (weekdayNight) {
      html += `　ディナー：${weekdayNight.start}〜${weekdayNight.end}<br>`;
    }
    html += `<br>`;
  }

  // ■ 土曜
  const satDay = buildSingleDayRange(data.schedule.saturday?.day, "day");
  const satNight = buildSingleDayRange(data.schedule.saturday?.night, "night");

  if (satDay || satNight) {
    html += `<strong>【土曜】</strong><br>`;
    if (satDay) {
      html += `　ランチ：${satDay.start}〜${satDay.end}<br>`;
    }
    if (satNight) {
      html += `　ディナー：${satNight.start}〜${satNight.end}<br>`;
    }
    html += `<br>`;
  } else {
    // 両方✕ → 定休日として表示
    html += `<strong>【土曜】</strong><br>　定休日<br><br>`;
  }

  // ■ 日曜・祝日の定休日／営業
  const sunDay = buildSingleDayRange(data.schedule.sunday?.day, "day");
  const sunNight = buildSingleDayRange(data.schedule.sunday?.night, "night");
  const holDay = buildSingleDayRange(data.schedule.holiday?.day, "day");
  const holNight = buildSingleDayRange(data.schedule.holiday?.night, "night");

  const sundayAllClosed = !sunDay && !sunNight;
  const holidayAllClosed = !holDay && !holNight;

  // 両方とも完全に休み → まとめて表示
  if (sundayAllClosed && holidayAllClosed) {
    html += `<strong>【日曜・祝日】</strong><br>　定休日<br>`;
  } else {
    // 日曜
    if (sunDay || sunNight) {
      html += `<strong>【日曜】</strong><br>`;
      if (sunDay) {
        html += `　ランチ：${sunDay.start}〜${sunDay.end}<br>`;
      }
      if (sunNight) {
        html += `　ディナー：${sunNight.start}〜${sunNight.end}<br>`;
      }
      html += `<br>`;
    } else if (!sundayAllClosed) {
      html += `<strong>【日曜】</strong><br>　定休日<br><br>`;
    }

    // 祝日
    if (holDay || holNight) {
      html += `<strong>【祝日】</strong><br>`;
      if (holDay) {
        html += `　ランチ：${holDay.start}〜${holDay.end}<br>`;
      }
      if (holNight) {
        html += `　ディナー：${holNight.start}〜${holNight.end}<br>`;
      }
      html += `<br>`;
    } else if (!holidayAllClosed) {
      html += `<strong>【祝日】</strong><br>　定休日<br>`;
    }
  }

  // ▼ 初期ロード
  async function loadSettings() {
    const res = await fetch("/.netlify/functions/get-settings");
    window.__settings = await res.json();

    updateBusinessStatus();
    updateScheduleTable();
    updateBusinessText();
  }

  // ページ読み込み後に実行
  loadSettings();
  setInterval(updateBusinessStatus, 60000);

  container.innerHTML = html;
}
