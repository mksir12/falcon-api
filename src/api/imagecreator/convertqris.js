const axios = require("axios");

module.exports = function (app) {
  app.get("/imagecreator/convertqris", async (req, res) => {
    const { qris, amount, tax } = req.query;

    if (!qris || !amount) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'qris' dan 'amount' wajib diisi"
      });
    }

    try {
      const url = `https://fathurweb.xyz/api/convert?qris=${encodeURIComponent(qris)}&amount=${encodeURIComponent(amount)}${tax ? `&tax=${encodeURIComponent(tax)}` : ""}`;
      const { data } = await axios.get(url, { responseType: "arraybuffer" });

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": data.length
      });
      res.end(data);
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal mengubah QRIS",
        error: err.message
      });
    }
  });
};
