import { getStore } from "@netlify/blobs";

export const handler = async () => {
  const store = getStore("settings"); // ストア名は自由
  const json = await store.get("data.json", { type: "json" });

  // まだ保存されていない場合は初期値を返す
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
