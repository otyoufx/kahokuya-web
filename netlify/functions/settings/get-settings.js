const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  const filePath = path.join(__dirname, "data.json");
  const json = fs.readFileSync(filePath, "utf8");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: json
  };
};
