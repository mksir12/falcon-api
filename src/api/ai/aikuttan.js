const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

  // --------- GET /ai/spotify ----------
  app.get('/ai/spotify', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        error: "Spotify URL is required"
      });
    }

    try {
      const result = await spotifydl(url);

      return res.json({
        success: true,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        result
      });

    } catch (err) {
      return res.status(500).json({
        success: false,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        error: err.message
      });
    }
  });

  // --------- POST /ai/spotify ----------
  app.post('/ai/spotify', async (req, res) => {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        error: "Spotify URL is required"
      });
    }

    try {
      const result = await spotifydl(url);

      return res.json({
        success: true,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        result
      });

    } catch (err) {
      return res.status(500).json({
        success: false,
        creator: "JerryCoder",
        telegram: "@oggy_workshop",
        error: err.message
      });
    }
  });

};



// --------- SPOTIFY DOWNLOADER FUNCTION ----------
async function spotifydl(url) {
  if (!url || !url.includes("open.spotify.com")) {
    throw new Error("Invalid Spotify URL");
  }

  try {
    const rynn = await axios.get("https://spotdl.io/", {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537",
      },
    });

    const $ = cheerio.load(rynn.data);

    const api = axios.create({
      baseURL: "https://spotdl.io",
      headers: {
        cookie: rynn.headers["set-cookie"].join("; "),
        "content-type": "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537",
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
