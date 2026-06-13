exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    const { from, subject, body } = JSON.parse(event.body);

    // 今日の日付 YYYY/MM/DD
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}/${mm}/${dd}`;

    const token = process.env.GITHUB_TOKEN;
    const repoOwner = "otyoufx";
    const repoName = "kahokuya-web";
    const filePath = "netlify/functions/data.json";

    if (!token) {
      return {
        statusCode: 500,
        body: "GITHUB_TOKEN が設定されていません。"
      };
    }

    // ▼ 現在の data.json を取得
    const getRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    if (!getRes.ok) {
      const text = await getRes.text();
      console.error("GitHub GET error:", text);
      return {
        statusCode: 500,
        body: "設定ファイルの取得に失敗しました。"
      };
    }

    const getData = await getRes.json();
    const currentJson = JSON.parse(
      Buffer.from(getData.content, "base64").toString("utf8")
    );

    // ▼ notice を上書き
    currentJson.notice = {
      enabled: true,
      title: today,
      body: body.trim()
    };

    // ▼ base64 に変換
    const newContent = Buffer.from(JSON.stringify(currentJson, null, 2)).toString("base64");

    // ▼ GitHub API へ PUT
    const putRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "update notice [skip ci]",
          content: newContent,
          sha: getData.sha
        })
      }
    );

    if (!putRes.ok) {
      const text = await putRes.text();
      console.error("GitHub PUT error:", text);
      return {
        statusCode: 500,
        body: "お知らせの更新に失敗しました。"
      };
    }

    return {
      statusCode: 200,
      body: "notice updated"
    };

  } catch (err) {
    console.error("update-news error:", err);
    return {
      statusCode: 500,
      body: "Error: " + err.message
    };
  }
};
