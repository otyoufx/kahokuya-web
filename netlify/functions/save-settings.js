const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const store = getStore("settings");
    await store.set("data.json", JSON.stringify(body, null, 2));

    return {
      statusCode: 200,
      body: "OK"
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Error saving settings"
    };
  }
};
