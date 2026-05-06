const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  try {
    const filePath = path.join(__dirname, "data.json");
    const json = fs.readFileSync(filePath, "utf8");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: json
    };
  } catch (err) {
    console.error("get-settings error:", err);
    return {
      statusCode: 500,
      body: "Error loading settings"
    };
  }
};
