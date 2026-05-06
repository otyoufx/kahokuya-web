import fs from "fs";
import path from "path";

export const handler = async () => {
  const filePath = path.join(process.cwd(), "netlify", "data.json");
  const json = fs.readFileSync(filePath, "utf8");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: json
  };
};
