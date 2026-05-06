const { blobs } = require("@netlify/blobs");

exports.handler = async () => {
  try {
    const store = blobs().store("settings");

    // data.json を JSON として取得（存在しない場合は null）
    const data = await store.get("data.json", { type: "json" });

    return {
      statusCode: 200,
      body: JSON.stringify(data || {}),
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
