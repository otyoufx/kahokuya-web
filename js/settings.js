// ===============================================
// 営業設定・お知らせ設定・画像選択 UI 制御
// image-stock.json（画像DB）対応版
// ===============================================

// 曜日キーと表示ラベル
const WEEK_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "holiday"];
const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日", "祝"];

// ---------------------------------------------------------------
// UI のセル生成（昼・夜の営業設定）
// ---------------------------------------------------------------
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

// ---------------------------------------------------------------
// フォルダ名 → 表示用日付（2026-06-17_2003 → 2026/06/17 20:03）
// ---------------------------------------------------------------
function formatFolderName(folder) {
  if (!folder) return "受信日時不明";

  const [date, time] = folder.split("_");
  const [y, m, d] = date.split("-");
  const HH = time.slice(0, 2);
  const MM = time.slice(2, 4);

  return `${y}/${m}/${d} ${HH}:${MM} 受信分`;
}

// ---------------------------------------------------------------
// 画像一覧の描画（最新セットのみ）
// ---------------------------------------------------------------
function renderImages(images, folderName) {
  const container = document.getElementById("imageList");
  container.innerHTML = ""; // 初期化

  if (!images || images.length === 0) {
    container.innerHTML = "<p>画像はありません。</p>";
    return;
  }

  // グループ枠
  const group = document.createElement("div");
  group.className = "image-group";

  // タイトル（受信日時）
  const title = document.createElement("div");
  title.className = "image-group-title";
  title.textContent = formatFolderName(folderName);
  group.appendChild(title);

  // 2列グリッド
  const grid = document.createElement("div");
  grid.className = "image-grid";

  images.forEach((url, index) => {
    const card = document.createElement("div");
    card.className = "image-card";

    // チェックボックス
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" class="image-check" value="${url}">
      ${String(index + 1).padStart(2, "0")}.jpg
    `;
    card.appendChild(label);

    // 画像本体
    const img = document.createElement("img");
    img.src = url;
    card.appendChild(img);

    grid.appendChild(card);
  });

  group.appendChild(grid);
  container.appendChild(group);
}

// ---------------------------------------------------------------
// 初期ロード：設定読み込み + 画像DB読み込み
// ---------------------------------------------------------------
async function loadSettingsToUI() {
  // ▼ 1. data.json（営業設定・お知らせ設定）を取得
  const res = await fetch("/.netlify/functions/get-settings?ts=" + Date.now());
  const data = await res.json();

  // ▼ 営業モード反映
  document.querySelector(
    `input[name='forceClosed'][value='${data.forceClosed ? "closed" : "open"}']`
  ).checked = true;

  // ▼ 営業時間テーブル生成
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

  // ▼ 営業時間データ反映
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

  // ▼ お知らせ設定
  document.getElementById("noticeEnabled").checked = data.notice.enabled;
  document.querySelector(".notice-body").value = data.notice.body;

  // -----------------------------------------------------------
  // ▼ 2. image-stock.json（画像DB）を取得して最新セットを表示
  // -----------------------------------------------------------
  const stockRes = await fetch("/netlify/functions/image-stock.json?ts=" + Date.now());
  const stock = await stockRes.json();

  if (!Array.isArray(stock) || stock.length === 0) {
    renderImages([], null);
  } else {
    const latest = stock[0]; // unshift で常に先頭が最新
    renderImages(latest.images, latest.date);
  }
}

loadSettingsToUI();

// ---------------------------------------------------------------
// 保存処理（営業設定・お知らせ設定のみ）
// ---------------------------------------------------------------
document.getElementById("saveBtn").addEventListener("click", async () => {
  const forceClosed = document.querySelector("input[name='forceClosed']:checked").value === "closed";

  const schedule = {};
  const dayRow = document.querySelector("tr[data-slot='day']");
  const nightRow = document.querySelector("tr[data-slot='night']");

  // ▼ 営業時間の収集
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

  // ▼ 今日の日付（お知らせタイトル用）
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}/${mm}/${dd}`;

  // ▼ 保存 payload
  const payload = {
    forceClosed,
    schedule,
    notice: {
      enabled: document.getElementById("noticeEnabled").checked,
      title: today,
      body: document.querySelector(".notice-body").value.trim()
    },
    password: document.getElementById("updatePass").value
  };

  // ▼ 保存 API 呼び出し
  const res = await fetch("/.netlify/functions/save-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  alert(text);
});

// ---------------------------------------------------------------
// パスワード表示切替
// ---------------------------------------------------------------
document.getElementById("togglePass").addEventListener("click", () => {
  const pass = document.getElementById("updatePass");
  pass.type = pass.type === "password" ? "text" : "password";
});
