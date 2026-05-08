exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const token = process.env.GITHUB_TOKEN;
    const repoOwner = "otyoufx";
    const repoName = "kahokuya-web";
    const filePath = "netlify/functions/data.json";

    // ▼ 現在の data.json を取得
    const getRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const getData = await getRes.json();

    // ▼ 更新内容を base64 に変換
    const newContent = Buffer.from(JSON.stringify(body, null, 2)).toString("base64");

    // ▼ Netlify ビルドをスキップするコミットメッセージ
    const commitMessage = "update settings [skip ci]";

    // ▼ GitHub API へ PUT（更新）
    await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: commitMessage,
          content: newContent,
          sha: getData.sha
        })
      }
    );

    // ▼ UI に返すレスポンス（純テキスト）
    return {
      statusCode: 200,
      body: "設定内容を更新しました！"
    };

  } catch (err) {
    console.error("save-settings error:", err);
    return {
      statusCode: 500,
      body: "設定の保存に失敗しました。"
    };
  }
};
