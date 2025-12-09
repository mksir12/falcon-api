const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/download/spotify", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'url' wajib diisi (link Spotify)"
      });
    }

    try {
      const result = await spotifydl(url);

      if (!result || !result.download_url) {
        return res.status(404).json({
          status: false,
          message: "Gagal mengambil data lagu dari Spotify."
        });
      }

      res.json({
        status: true,
        creator: "FlowFalcon",
        result: {
          title: result.name,
          artist: result.artists,
          album: result.album_name,
          releaseDate: result.release_date,
          cover: result.cover_url,
          download_url: result.download_url
        }
      });

    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Terjadi kesalahan saat memproses permintaan.",
        error: e.message || e
      });
    }
  });
};



// -------------- SPOTIFY SCRAPER (spotdl.io) --------------
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
      download_url: dl.url
    };

  } catch (err) {
    throw new Error(err.message);
  }
}
