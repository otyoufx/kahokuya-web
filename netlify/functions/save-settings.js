exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // ▼ パスワード判定
    if (!body.password || body.password !== process.env.ADMIN_PASSCODE) {
      return {
        statusCode: 403,
        body: "パスワードが違います。"
      };
    }

    // ▼ 画像枚数チェック（4枚以上ならエラー）
    if (body.notice.images && body.notice.images.length > 3) {
      return {
        statusCode: 400,
        body: "画像が4枚以上選ばれています！\n画像は3枚以下にしてください！"
      };
    }

    // ▼ ここから先は今まで通り
    const token = process.env.GITHUB_TOKEN;
    const repoOwner = "otyoufx";
    const repoName = "kahokuya-web";
    const filePath = "netlify/functions/data.json";

    if (!token) {
      console.error("Missing GITHUB_TOKEN");
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

    // ▼ 更新内容を base64 に変換
    const newContent = Buffer.from(JSON.stringify(saveData, null, 2)).toString("base64");

    // ▼ Netlify ビルドをスキップするコミットメッセージ
    const commitMessage = "update settings [skip ci]";

    // ▼ GitHub API へ PUT（更新）
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
          message: commitMessage,
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
        body: "設定の保存に失敗しました。"
      };
    }

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
