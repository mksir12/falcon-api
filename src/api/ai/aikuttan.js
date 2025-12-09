const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  // --------- CORS Middleware ----------
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // --------- Spotify Downloader Logic ----------
  async function spotifydl(url) {
    if (!url || !url.includes("open.spotify.com")) {
      throw new Error("Invalid Spotify URL");
    }

    try {
      const rynn = await axios.get("https://spotdl.io/", {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(rynn.data);

      const api = axios.create({
        baseURL: "https://spotdl.io",
        headers: {
          cookie: rynn.headers["set-cookie"].join("; "),
          "content-type": "application/json",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "x-csrf-token": $('meta[name="csrf-token"]').attr("content"),
        },
      });

      const [{ data: meta }, { data: dl }] = await Promise.all([
        api.post("/getTrackData", { spotify_url: url }),
        api.post("/convert", { urls: url }),
      ]);

      return {
        ...meta,
        download_url: dl.url,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // --------- GET Endpoint ----------
  app.get("/spotify", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url)
        return res
          .status(400)
          .json({ success: false, error: "Spotify URL is required" });

      const result = await spotifydl(url);

      res.json({
        success: true,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        result,
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        error: e.message,
      });
    }
  });

  // --------- POST Endpoint ----------
  app.post("/spotify", async (req, res) => {
    try {
      const { url } = req.body || {};
      if (!url)
        return res
          .status(400)
          .json({ success: false, error: "Spotify URL is required" });

      const result = await spotifydl(url);

      res.json({
        success: true,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        result,
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        error: e.message,
      });
    }
  });
};
