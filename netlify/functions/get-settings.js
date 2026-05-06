const { blobs } = require("@netlify/blobs");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
console.log("DEBUG: get-settings START");
  try {
    const store = blobs().store("settings");

    // まず store.get() を試す（store が無いと例外）
    let data = null;
    try {
      data = await store.get("data.json", { type: "json" });
    } catch (e) {
      // store が存在しない or data.json が無い
      data = null;
    }

    // 初回：Blobs に data.json が無い → Git の data.json を使う
    if (!data) {
      const filePath = path.join(__dirname, "data.json");
      const fileContent = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(fileContent);

      // 初回だけ Blobs に保存（ここで store が作られる）
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
