// main_test.js
// 新仕様：曜日 × 昼夜 × openMark + enabled + start/end

// ▼ 祝日判定（holidays.json を fetch）
async function isHoliday(date) {
  try {
    const res = await fetch("/holidays.json");
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
  document.getElementById("now-time").textContent =
    `只今の日時：${y}/${m}/${d} ${hh}:${mm}`;

  // ▼ ① forceClosed
  if (data.forceClosed) {
    document.getElementById("now-status").textContent = "本日は臨時休業です";
    return;
  }

  // ▼ ② 祝日判定
  const holiday = await isHoliday(now);

  // ▼ ③ 曜日キー
  const weekKeys = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayKey = holiday ? "holiday" : weekKeys[now.getDay()];

  const schedule = data.schedule[dayKey];
  if (!schedule) {
    document.getElementById("now-status").textContent = "営業時間データなし";
    return;
  }

  // ▼ ④ 昼・夜の判定
  const slots = ["day", "night"];
  let isOpen = false;

  for (const slot of slots) {
    const s = schedule[slot];

    // openMark ✕ → 休み
    if (s.openMark !== "◯") continue;

    // enabled false → 休み
    if (!s.enabled) continue;

    // start/end 空 → 休み
    if (!s.start || !s.end) continue;

    // 時間帯判定
    if (time >= s.start && time <= s.end) {
      isOpen = true;
      break;
    }
  }

  document.getElementById("now-status").textContent =
    isOpen ? "営業中です。" : "営業時間外です。";
}

// ▼ 営業日・営業時間テーブルを更新
function updateScheduleTable() {
  const data = window.__settings;
  if (!data) return;

  const table = document.querySelector(".schedule-table");
  const dayRow = table.rows[1].cells;
  const nightRow = table.rows[2].cells;

  const weekKeys = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

  weekKeys.forEach((key, i) => {
    const day = data.schedule[key].day;
    const night = data.schedule[key].night;

    // 表示は openMark（◯✕）だけ
    dayRow[i + 1].textContent = day.openMark;
    nightRow[i + 1].textContent = night.openMark;
  });
}
