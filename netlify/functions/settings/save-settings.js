const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  const filePath = path.join(__dirname, "data.json");
  const body = JSON.parse(event.body);

  fs.writeFileSync(filePath, JSON.stringify(body, null, 2));

  return {
    statusCode: 200,
    body: "OK"
  };
};
