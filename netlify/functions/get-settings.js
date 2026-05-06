const { blobs } = require("@netlify/blobs");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  try {
    const store = blobs().store("settings");

    // Blobs の data.json を読み込み（存在しない場合は null）
    let data = await store.get("data.json", { type: "json", fallback: null });

    // 初回：Blobs に data.json が無い → Git の data.json を使う
    if (!data) {
      const filePath = path.join(__dirname, "data.json");
      const fileContent = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(fileContent);

      // 初回だけ Blobs に保存しておく
      await store.set("data.json", data, { type: "json" });
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
