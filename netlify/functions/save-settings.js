exports.handler = async (event) => {
  console.log("DEBUG: save-settings START");

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

  // 保存するデータ
  let newData;
  try {
    newData = JSON.parse(event.body);
  } catch (e) {
    console.error("Invalid JSON:", e);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" })
    };
  }

  try {
    // ① 現在の SHA を取得
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (!getRes.ok) {
      const text = await getRes.text();
      console.error("GitHub GET error:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GitHub GET error", detail: text })
      };
    }

    const getJson = await getRes.json();
    const sha = getJson.sha;

    // ② 新しい JSON を base64 に変換
    const encoded = Buffer.from(JSON.stringify(newData, null, 2)).toString("base64");

    // ③ PUT で更新
    const putRes = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: "Update settings via Netlify Function",
        content: encoded,
        sha: sha
      })
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      console.error("GitHub PUT error:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GitHub PUT error", detail: text })
      };
    }

    console.log("DEBUG: Saved settings OK");

  return {
    statusCode: 200,
    body: JSON.stringify({ "設定内容を更新しました！": true })
  };

  } catch (err) {
    console.error("save-settings error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save settings" })
    };
  }
};
