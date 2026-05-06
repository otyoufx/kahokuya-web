const { blobs } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const store = blobs().store("settings");

    const body = JSON.parse(event.body);

    // data.json に JSON として保存
    await store.set("data.json", body, { type: "json" });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
      headers: { "Content-Type": "application/json" }
    };
  } catch (err) {
    console.error("save-settings error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save settings" })
    };
  }
};
