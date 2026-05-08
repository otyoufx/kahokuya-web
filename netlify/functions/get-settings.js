const { kv } = require("@netlify/kv");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  console.log("DEBUG: get-settings START");

  try {
    // KV から読み込み
    let data = await kv.get("settings:data.json");
    console.log("DEBUG: KV GET:", data ? "HIT" : "MISS");

    // 初回 or KV に無い場合は Git の data.json を読む
    if (!data) {
      const filePath = path.join(__dirname, "data.json");
      console.log("DEBUG: reading Git data.json from", filePath);

      const fileContent = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(fileContent);

      // KV に保存
      await kv.set("settings:data.json", data);
      console.log("DEBUG: KV SET done");
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
