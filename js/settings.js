// ===============================================
// 営業設定・お知らせ設定・画像選択 UI 制御
// ===============================================

const WEEK_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "holiday"];

// ---------------------------------------------------------------
// UI のセル生成
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
// フォルダ名 → 表示用日付
// ---------------------------------------------------------------
function formatFolderName(folder) {
  if (!folder) return "受信日時不明";
  const [date, time] = folder.split("_");
  return `${date.replace(/-/g, "/")} ${time.slice(0,2)}:${time.slice(2,4)} 受信分`;
}

// ---------------------------------------------------------------
// 画像一覧の描画（複数世代対応）
// ---------------------------------------------------------------
function renderImages(images, folderName) {
  const container = document.getElementById("imageList");

  if (!images || images.length === 0) {
    container.innerHTML += "<p>画像はありません。</p>";
    return;
  }

  const group = document.createElement("div");
  group.className = "image-group";

  const title = document.createElement("div");
  title.className = "image-group-title";
  title.textContent = formatFolderName(folderName);
  group.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "image-grid";

  images.forEach((url, index) => {
    const card = document.createElement("div");
    card.className = "image-card";

    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" class="image-check" value="${url}">
      ${String(index + 1).padStart(2, "0")}.jpg
    `;
    card.appendChild(label);

    const img = document.createElement("img");
    img.src = url;
    card.appendChild(img);

    grid.appendChild(card);
  });

  group.appendChild(grid);
  container.appendChild(group);
}

// ---------------------------------------------------------------
// 初期ロード
// ---------------------------------------------------------------
async function loadSettingsToUI() {
  const res = await fetch("/.netlify/functions/get-settings?ts=" + Date.now());
  const data = await res.json();

  // 営業モード
  document.querySelector(
    `input[name='forceClosed'][value='${data.forceClosed ? "closed" : "open"}']`
  ).checked = true;

  // 営業時間テーブル生成
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

  // 営業時間反映
  WEEK_KEYS.forEach((key, i) => {
    const daySlot = data.schedule[key].day;
    const nightSlot = data.schedule[key].night;

    const dayCell = dayRow.children[i + 1];
    dayCell.querySelector(".openMark").value = daySlot.openMark;
    dayCell.querySelector(".start").value = daySlot.start;
    dayCell.querySelector(".end").value = daySlot.end;

    const nightCell = nightRow.children[i + 1];
    nightCell.querySelector(".openMark").value = nightSlot.openMark;
    nightCell.querySelector(".start").value = nightSlot.start;
    nightCell.querySelector(".end").value = nightSlot.end;
  });

  // お知らせ
  document.getElementById("noticeEnabled").checked = data.notice.enabled;
  document.querySelector(".notice-body").value = data.notice.body;

  // 画像DB（最大3世代）
  const stockRes = await fetch("/netlify/functions/image-stock.json?ts=" + Date.now());
  const stock = await stockRes.json();

  const container = document.getElementById("imageList");
  container.innerHTML = "";

  if (Array.isArray(stock)) {
    stock.slice(0, 3).forEach(entry => {
      renderImages(entry.images, entry.date);
    });
  }

  // ▼ 保存済みの notice.images をチェック状態に反映
  if (Array.isArray(data.notice.images)) {
    data.notice.images.forEach(url => {
      const cb = document.querySelector(`.image-check[value="${url}"]`);
      if (cb) cb.checked = true;
    });
  }
}

loadSettingsToUI();

// ---------------------------------------------------------------
// 保存処理
// ---------------------------------------------------------------
document.getElementById("saveBtn").addEventListener("click", async () => {
  const forceClosed = document.querySelector("input[name='forceClosed']:checked").value === "closed";

  const schedule = {};
  const dayRow = document.querySelector("tr[data-slot='day']");
  const nightRow = document.querySelector("tr[data-slot='night']");

  WEEK_KEYS.forEach((key, i) => {
    const dayCell = dayRow.children[i + 1];
    const nightCell = nightRow.children[i + 1];

    schedule[key] = {
      day: {
        openMark: dayCell.querySelector(".openMark").value,
        start: dayCell.querySelector(".start").value,
        end: dayCell.querySelector(".end").value,
        enabled:
          dayCell.querySelector(".openMark").value === "◯" &&
          dayCell.querySelector(".start").value &&
          dayCell.querySelector(".end").value
      },
      night: {
        openMark: nightCell.querySelector(".openMark").value,
        start: nightCell.querySelector(".start").value,
        end: nightCell.querySelector(".end").value,
        enabled:
          nightCell.querySelector(".openMark").value === "◯" &&
          nightCell.querySelector(".start").value &&
          nightCell.querySelector(".end").value
      }
    };
  });

  // 今日の日付
  const now = new Date();
  const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

  // ▼ チェックされた画像
  const selectedImages = Array.from(
    document.querySelectorAll(".image-check:checked")
  ).map(cb => cb.value);

  const payload = {
    forceClosed,
    schedule,
    notice: {
      enabled: document.getElementById("noticeEnabled").checked,
      title: today,
      body: document.querySelector(".notice-body").value.trim(),
      images: selectedImages
    },
    password: document.getElementById("updatePass").value
  };

  const res = await fetch("/.netlify/functions/save-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  alert(await res.text());
});

// ---------------------------------------------------------------
// パスワード表示切替
// ---------------------------------------------------------------
document.getElementById("togglePass").addEventListener("click", () => {
  const pass = document.getElementById("updatePass");
  pass.type = pass.type === "password" ? "text" : "password";
});
