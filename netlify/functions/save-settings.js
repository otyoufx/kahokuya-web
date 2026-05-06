const fs = require("fs");
const path = require("path");

require("./data.json");

exports.handler = async (event) => {
  try {
    const filePath = path.join(__dirname, "data.json");
    const body = JSON.parse(event.body);
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
    return { statusCode: 200, body: "OK" };
  } catch {
    return { statusCode: 500, body: "Error saving settings" };
  }
};
