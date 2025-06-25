const axios = require("axios");

function containsEmoji(text) {
  return /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g.test(text);
}

module.exports = function (app) {
  app.get("/imagecreator/demote", async (req, res) => {
    const { bg, ppuser, text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'bg', 'ppuser' dan 'text' wajib diisi"
      });
    }

    if (text.length > 300) {
      return res.status(400).json({
        status: false,
        message: "Max karakter: text 300"
      });
    }

    if (containsEmoji(text)) {
      return res.status(400).json({
        status: false,
        message: "Maaf, emoji belum didukung"
      });
    }

    try {
      const image = await axios.get(`https://fathur.dpdns.org/api/layout?bg=${encodeURIComponent(bg)}&ppuser=${encodeURIComponent(ppuser)}&content=DEMOTE&subtext=${encodeURIComponent(text)}`, {
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
