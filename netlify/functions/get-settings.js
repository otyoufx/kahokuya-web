const fs = require("fs");
const path = require("path");

exports.handler = async () => {
// data.json の場所指定
  const filePath = path.join(process.cwd(), "data.json");
  const json = fs.readFileSync(filePath, "utf8");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: json
  };
};
