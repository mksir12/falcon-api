const axios = require("axios");

module.exports = function (app) {
  app.get("/tools/nsfw-check", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'url' gambar wajib diisi."
      });
    }

    try {
      const { data } = await axios.get(`https://nsfw-categorize.it/api/upload?url=${encodeURIComponent(url)}`, {
        headers: {
          accept: "application/json",
          "x-requested-with": "XMLHttpRequest"
        }
      });

      res.json({
        status: true,
        result: data
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal memeriksa NSFW",
        error: err.response?.data || err.message
      });
    }
  });
};
