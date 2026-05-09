// get-settings.js
exports.handler = async () => {
  console.log("DEBUG: get-settings START");

  const owner = "otyoufx";
  const repo = "kahokuya-web";
  const path = "netlify/functions/data.json";
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error("Missing GITHUB_TOKEN");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing GITHUB_TOKEN" })
    };
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("GitHub API error:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GitHub API error", detail: text })
      };
    }

    const json = await res.json();

    // base64 → JSON
    const content = Buffer.from(json.content, "base64").toString("utf-8");
    const data = JSON.parse(content);

    console.log("DEBUG: Loaded settings OK");

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    };

  } catch (err) {
    console.error("get-settings error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to load settings" })
    };
  }
};
