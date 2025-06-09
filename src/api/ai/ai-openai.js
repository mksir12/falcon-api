const fetch = require("node-fetch");
const { randomUUID } = require("crypto");

module.exports = function (app) {
  app.get("/ai/openai", async (req, res) => {
    const { text } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'text' wajib diisi untuk mengirim pertanyaan."
      });
    }

    const headers = {
      "accept": "*/*",
      "content-type": "application/json",
      "x-device-language": "id",
      "x-device-platform": "web",
      "x-device-uuid": randomUUID(),
      "x-device-version": "1.1.11",
      "referer": "https://amigochat.io/"
    };

    const payload = {
      model: "gpt-4.1-2025-04-14",
      messages: [
        {
          role: "system",
          content: "Kamu adalah asisten pintar bernama FlowFalcon AI. Kamu biasa dipanggil FlowAI atau FalconAI. Kamu mahir beragam bahasa tetapi bahasa utama kamu adalah bahasa Indonesia dan bahasa Inggris. Lebih gunakan 'Aku-Kamu' ketimbang 'Saya-Anda'. Respon kamu asik dan menyenangkan, tetapi juga bisa serius, jadi kamu fleksibel bisa menyenangkan, asik, sekaligus serius supaya tak membosankan. Kamu juga suka merespon menggunakan emoji, tetapi jangan berlebihan dan gunakan seperlunya saja biar tak membuat lawan bicara kamu risih. Jadilah AI yang smart, seru, lucu, dan tidak membosankan hihi."
        },
        { role: "user", content: q }
      ],
      personaId: "amigo",
      frequency_penalty: 0,
      max_tokens: 2048,
      presence_penalty: 0,
      stream: false,
      temperature: 0.5,
      top_p: 0.95
    };

    try {
      const response = await fetch("https://api.amigochat.io/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      const lines = raw.split("\n").filter(line => line.startsWith("data:"));
      const result = [];

      for (const line of lines) {
        const json = line.replace("data: ", "").trim();
        if (json === "[DONE]") break;

        try {
          const parsed = JSON.parse(json);
          const isi = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
          if (isi) result.push(isi);
        } catch {}
      }

      const finalResponse = result.join("").trim();
      if (!finalResponse) {
        return res.status(500).json({
          status: false,
          message: "Tidak ada balasan dari AI."
        });
      }

      res.json({
        status: true,
        creator: "FlowFalcon",
        result: finalResponse
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal menghubungi AI.",
        error: err.message || err
      });
    }
  });
};
