const axios = require("axios");
const crypto = require("crypto");

module.exports = function (app) {
  app.get("/tools/ghibli-ai", async (req, res) => {
    const { url, prompt } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'url' wajib diisi."
      });
    }

    // Generate session ID & timestamp
    const sessionId = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now().toString();

    const payload = {
      imageUrl: url,
      sessionId,
      prompt: prompt || "Please convert this image into Studio Ghibli art style with the Ghibli AI generator.",
      timestamp
    };

    const headers = {
      "content-type": "application/json"
    };

    try {
      // Step 1: Kirim gambar ke GhibliAI
      const { data: postData } = await axios.post("https://ghibliai.ai/api/transform-stream", payload, { headers });
      const taskId = postData.taskId;

      let attempt = 0;
      while (attempt < 150) {
        const { data: pollData } = await axios.get(`https://ghibliai.ai/api/transform-stream?taskId=${taskId}`, { headers });

        if (pollData.status === "success") {
          return res.json({
            status: true,
            creator: "FlowFalcon",
            taskId,
            result: pollData
          });
        }

        if (pollData.status === "error") {
          return res.status(500).json({
            status: false,
            message: "Terjadi kesalahan dari server GhibliAI.",
            error: pollData.error || pollData
          });
        }

        await new Promise(r => setTimeout(r, 2000));
        attempt++;
      }

      res.status(504).json({
        status: false,
        message: "Timeout: GhibliAI tidak merespon dalam waktu wajar. Coba lagi nanti."
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Gagal memproses permintaan.",
        error: e.response?.data || e.message
      });
    }
  });
};
