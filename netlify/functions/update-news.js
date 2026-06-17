exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    // ▼ GAS から送られてくるデータ（画像URLのみ）
    const { images, folderName } = JSON.parse(event.body);

    if (!images || images.length === 0) {
      return {
        statusCode: 400,
        body: "No images provided"
      };
    }

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

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "NetlifyFunction"
    };

    // ▼ data.json を取得
    const getRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      { headers }
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

    // ▼ “お知らせ” 関連は一切触らない
    // notice というキーも使わない

    // ▼ 画像ストック専用のキーに保存
    currentJson.images = images;

    if (folderName) {
      currentJson.imageFolder = folderName;
    }

    // ▼ base64 に変換
    const newContent = Buffer.from(
      JSON.stringify(currentJson, null, 2)
    ).toString("base64");

    // ▼ GitHub PUT
    const putRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "update images only [skip ci]",
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
        body: "画像の更新に失敗しました。"
      };
    }

    return {
      statusCode: 200,
      body: "images updated"
    };

  } catch (err) {
    console.error("update-news error:", err);
    return {
      statusCode: 500,
      body: "Error: " + err.message
    };
  }
};
