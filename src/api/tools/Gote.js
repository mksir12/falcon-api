const axios = require("axios");

module.exports = function (app) {
  app.get("/tools/gore-check", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'url' wajib diisi (link gambar)."
      });
    }

    try {
      const { data } = await axios.post(
        "https://api-inference.huggingface.co/models/akhaliq/NSFW_Gore_Image_Detector",
        { inputs: url },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
            "referer": "https://huggingface.co",
            "origin": "https://huggingface.co"
          }
        }
      );

      // Ambil label dengan confidence tertinggi
      const top = data.sort((a, b) => b.score - a.score)[0];

      res.json({
        status: true,
        creator: "FlowFalcon",
        result: {
          label: top.label,
          confidence: +(top.score * 100).toFixed(2) + "%",
          raw: data
        }
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Gagal mengecek konten gore",
        error: e.response?.data || e.message
      });
    }
  });
};
