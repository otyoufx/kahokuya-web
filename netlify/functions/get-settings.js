const fs = require("fs");
const path = require("path");

require("./data.json");

exports.handler = async () => {
  try {
    const filePath = path.join(__dirname, "data.json");
    const json = fs.readFileSync(filePath, "utf8");
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: json };
  } catch {
    return { statusCode: 500, body: "Error loading settings" };
  }
};
