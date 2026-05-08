const { getStore } = require("@netlify/blobs");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  console.log("DEBUG: get-settings START");

  try {
    // Netlify 上の Functions から使う場合は、siteID / token は不要
    const store = getStore("settings");

    let data = null;

    // Blobs 側に data.json があればそれを読む
    try {
      data = await store.get("data.json", { type: "json", fallback: null });
      console.log("DEBUG: loaded from Blobs:", data ? "HIT" : "MISS");
    } catch (e) {
      console.log("DEBUG: store.get error, fallback to Git file:", e.message);
      data = null;
    }

    // 初回 or Blobs にまだ無いときは Git の data.json を読む
    if (!data) {
      const filePath = path.join(__dirname, "data.json");
      console.log("DEBUG: reading Git data.json from", filePath);

      const fileContent = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(fileContent);

      // 読めたら Blobs に保存（ここで store が自動作成される）
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
