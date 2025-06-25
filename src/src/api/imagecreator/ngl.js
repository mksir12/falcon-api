const axios = require("axios");

function containsEmoji(text) {
  return /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g.test(text);
}

module.exports = function (app) {
  app.get("/imagecreator/ngl", async (req, res) => {
    const { title, text } = req.query;

    if (!title || !text) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'title' dan 'text' wajib diisi"
      });
    }

    if (title.length > 50 || text.length > 350) {
      return res.status(400).json({
        status: false,
        message: "Max karakter: title 50, text 350"
      });
    }

    if (containsEmoji(title) || containsEmoji(text)) {
      return res.status(400).json({
        status: false,
        message: "Maaf, emoji belum didukung"
      });
    }

    try {
      const image = await axios.get(`https://canvas-api-seven.vercel.app/api/ngl?title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}`, {
        responseType: "arraybuffer"
      });

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": image.data.length
      });
      res.end(image.data);
    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Gagal mengambil gambar",
        error: e.message
      });
    }
  });
};
