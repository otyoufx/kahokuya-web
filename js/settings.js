const WEEK_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "holiday"];
const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日", "祝"];

// ▼ UI のセル生成
function createCell() {
  return `
    <div>
      <select class="openMark">
        <option value="◯">◯</option>
        <option value="✕">✕</option>
      </select>
    </div>
    <div>
      <input type="time" class="start time-input">
      〜
      <input type="time" class="end time-input">
    </div>
  `;
}

// ▼ 初期ロード
async function loadSettingsToUI() {
  const res = await fetch("/.netlify/functions/get-settings");
  const data = await res.json();

  // 営業モード
  document.querySelector(`input[name='forceClosed'][value='${data.forceClosed ? "closed" : "open"}']`).checked = true;

  // テーブル生成
  const dayRow = document.querySelector("tr[data-slot='day']");
  const nightRow = document.querySelector("tr[data-slot='night']");

  WEEK_KEYS.forEach(() => {
    const td1 = document.createElement("td");
    td1.innerHTML = createCell();
    dayRow.appendChild(td1);

    const td2 = document.createElement("td");
    td2.innerHTML = createCell();
    nightRow.appendChild(td2);
  });

  // データ反映
  WEEK_KEYS.forEach((key, i) => {
    const daySlot = data.schedule[key].day;
    const nightSlot = data.schedule[key].night;

    // 昼
    const dayCell = dayRow.children[i + 1];
    dayCell.querySelector(".openMark").value = daySlot.openMark;
    dayCell.querySelector(".start").value = daySlot.start;
    dayCell.querySelector(".end").value = daySlot.end;

    // 夜
    const nightCell = nightRow.children[i + 1];
    nightCell.querySelector(".openMark").value = nightSlot.openMark;
    nightCell.querySelector(".start").value = nightSlot.start;
    nightCell.querySelector(".end").value = nightSlot.end;
  });

  // お知らせ（タイトル欄は削除したので読み込まない）
  document.getElementById("noticeEnabled").checked = data.notice.enabled;
  document.querySelector(".notice-body").value = data.notice.body;
}

loadSettingsToUI();


// ▼ 保存処理
document.getElementById("saveBtn").addEventListener("click", async () => {
  const forceClosed = document.querySelector("input[name='forceClosed']:checked").value === "closed";

  const schedule = {};

  const dayRow = document.querySelector("tr[data-slot='day']");
  const nightRow = document.querySelector("tr[data-slot='night']");

  WEEK_KEYS.forEach((key, i) => {
    const dayCell = dayRow.children[i + 1];
    const nightCell = nightRow.children[i + 1];

    const dayMark = dayCell.querySelector(".openMark").value;
    const dayStart = dayCell.querySelector(".start").value;
    const dayEnd = dayCell.querySelector(".end").value;

    const nightMark = nightCell.querySelector(".openMark").value;
    const nightStart = nightCell.querySelector(".start").value;
    const nightEnd = nightCell.querySelector(".end").value;

    schedule[key] = {
      day: {
        openMark: dayMark,
        enabled: dayMark === "◯" && dayStart !== "" && dayEnd !== "",
        start: dayStart,
        end: dayEnd
      },
      night: {
        openMark: nightMark,
        enabled: nightMark === "◯" && nightStart !== "" && nightEnd !== "",
        start: nightStart,
        end: nightEnd
      }
    };
  });

  // ▼ 今日の日付 YYYY/MM/DD を自動生成
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}/${mm}/${dd}`;

  const payload = {
    forceClosed,
    schedule,
    notice: {
      enabled: document.getElementById("noticeEnabled").checked,
      title: today,  // ← 自動生成
      body: document.querySelector(".notice-body").value.trim()
    },
    password: document.getElementById("updatePass").value
  };

  const res = await fetch("/.netlify/functions/save-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  alert(text);
});

document.getElementById("togglePass").addEventListener("click", () => {
  const pass = document.getElementById("updatePass");
  pass.type = pass.type === "password" ? "text" : "password";
});
