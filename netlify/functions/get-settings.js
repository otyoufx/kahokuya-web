const { blobs } = require("@netlify/blobs");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  console.log("DEBUG: get-settings START");

  try {
    const store = blobs().store("settings");

    let data = null;

    // Blobs の data.json を安全に読み込む
    try {
      data = await store.get("data.json", { type: "json", fallback: null });
    } catch (e) {
      console.log("DEBUG: store.get failed, using Git data.json");
      data = null;
    }

    // 初回：Blobs に data.json が無い → Git の data.json を使う
    if (!data) {
      const filePath = path.join(__dirname, "data.json");
      console.log("DEBUG: reading Git data.json from", filePath);

      const fileContent = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(fileContent);

      // 初回だけ Blobs に保存
      await store.set("data.json", data, { type: "json" });
      console.log("DEBUG: saved initial data.json to Blobs");
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    };

  } catch (err) {
    console.error("get-settings error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to load settings" })
    };
  }
};
