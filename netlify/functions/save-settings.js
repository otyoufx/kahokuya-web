const path = require("path");
const fs = require("fs");

exports.handler = async () => {
  const filePath = path.join(process.cwd(), "netlify", "data.json");
  const json = fs.readFileSync(filePath, "utf8");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: json
  };
};
