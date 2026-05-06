const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  const store = getStore("settings");
  const json = await store.get("data.json", { type: "json" });

  const defaultData = {
    forceClosed: false,
    schedule: {
      "昼": ["◯","✕","◯","◯","◯","◯","◯"],
      "夜": ["◯","✕","◯","◯","◯","◯","✕"]
    },
    notice: {
      enabled: false,
      title: "",
      body: ""
    }
  };

  return {
    statusCode: 200,
    body: JSON.stringify(json || defaultData)
  };
};
