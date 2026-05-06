import fs from "fs";
import path from "path";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body);

    const filePath = path.join(process.cwd(), "data.json");

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "保存しました！" })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "保存に失敗しました", error: err.message })
    };
  }
};
