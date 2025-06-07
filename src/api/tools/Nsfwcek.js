const axios = require("axios");
const FormData = require("form-data");

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
      // Step 1: Download gambar dari URL user
      const imageRes = await axios.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(imageRes.data);

      // Step 2: Upload via form ke nsfw-categorize
      const form = new FormData();
      form.append("image", buffer, {
        filename: "image.jpg",
        contentType: imageRes.headers["content-type"] || "image/jpeg"
      });

      const { data } = await axios.post("https://nsfw-categorize.it/api/upload", form, {
        headers: {
          ...form.getHeaders(),
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
        message: "Gagal proses NSFW",
        error: err.response?.data || err.message
      });
    }
  });
};
