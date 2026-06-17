const path = require("path");

exports.handler = async (event) => {
  try {
    console.log("payload:", event.body);
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { folderName, images } = JSON.parse(event.body);

    if (!folderName || !images || images.length === 0) {
      return { statusCode: 400, body: "Invalid payload" };
    }

    const token = process.env.GITHUB_TOKEN;
    const repoOwner = "otyoufx";
    const repoName = "kahokuya-web";

    if (!token) {
      return { statusCode: 500, body: "GITHUB_TOKEN missing" };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "NetlifyFunction"
    };

    // ▼ GitHub API: ファイル PUT
    async function putFile(filePath, contentBase64, sha = null) {
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

      const body = {
        message: `upload image ${filePath} [skip ci]`,
        content: contentBase64,
      };

      if (sha) body.sha = sha;

      const res = await fetch(url, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("PUT error:", text);
        throw new Error("GitHub PUT failed");
      }

      return res.json();
    }

    // ▼ 保存先
    const baseDir = `public-images/${folderName}`;

    // ▼ 画像保存
    const savedUrls = [];

    for (const img of images) {
      const filePath = `${baseDir}/${img.filename}`;
      await putFile(filePath, img.data);
      savedUrls.push(`/public-images/${folderName}/${img.filename}`);
    }

    // ▼ data.json 更新
    const dataPath = "netlify/functions/data.json";

    const getRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${dataPath}`,
      { headers }
    );

    const getData = await getRes.json();
    const currentJson = JSON.parse(
      Buffer.from(getData.content, "base64").toString("utf8")
    );

    currentJson.images = savedUrls;
    currentJson.imageFolder = folderName;

    const newContent = Buffer.from(
      JSON.stringify(currentJson, null, 2)
    ).toString("base64");

    await putFile(dataPath, newContent, getData.sha);

    return {
      statusCode: 200,
      body: "images saved to GitHub"
    };

  } catch (err) {
    console.error("update-news error:", err);
    return { statusCode: 500, body: "Error: " + err.message };
  }
};
