const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    const { from, subject, body } = JSON.parse(event.body);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}/${mm}/${dd}`;

    const dataPath = path.join(__dirname, "data.json");

    const json = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    json.notice = {
      enabled: true,
      title: today,
      body: body.trim()
    };

    fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "notice updated" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: "Error: " + error.message
    };
  }
};
