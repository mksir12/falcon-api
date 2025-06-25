const axios = require('axios');
const ProxyAgent = require('@rynn-k/proxy-agent');
const fs = require('fs');
const path = require('path');

module.exports = function (app) {
  const proxy = new ProxyAgent(path.join(__dirname, 'proxies.txt'), { random: true });

  app.get('/ai/kivotos', async (req, res) => {
    const {
      prompt,
      style = 'anime',
      width = 1024,
      height = 1024,
      guidance = 7,
      steps = 28
    } = req.query;

    if (!prompt) {
      return res.status(400).json({
        status: false,
        creator: 'FlowFalcon',
        message: 'Parameter prompt wajib diisi'
      });
    }

    const validStyles = ['anime', 'real', 'photo'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({
        status: false,
        creator: 'FlowFalcon',
        message: `Style harus salah satu dari: ${validStyles.join(', ')}`
      });
    }

    try {
      const agent = proxy.config();
      const session_hash = Math.random().toString(36).slice(2);
      const base = `https://heartsync-nsfw-uncensored${style !== 'anime' ? `-${style}` : ''}.hf.space`;

      const negative_prompt = 'lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, cropped, worst quality, low quality, watermark, blurry';

      // Step 1: Join queue
      await axios.post(`${base}/gradio_api/queue/join`, {
        data: [
          prompt,
          negative_prompt,
          0,
          true,
          parseInt(width),
          parseInt(height),
          parseFloat(guidance),
          parseInt(steps)
        ],
        event_data: null,
        fn_index: 2,
        trigger_id: 16,
        session_hash
      }, agent);

      // Step 2: Poll result
      let result = null;
      const maxTries = 15;

      for (let i = 0; i < maxTries; i++) {
        const { data: stream } = await axios.get(`${base}/gradio_api/queue/data?session_hash=${session_hash}`, {
          ...agent,
          responseType: 'text'
        });

        const lines = stream.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.msg === 'process_completed') {
              result = parsed.output?.data?.[0]?.url;
              break;
            }
          }
        }

        if (result) break;
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!result) {
        return res.status(500).json({
          status: false,
          creator: 'FlowFalcon',
          message: 'Gagal mendapatkan gambar dari server NSFW (Timeout)'
        });
      }

      // Step 3: Return image buffer
      const img = await axios.get(result, {
        responseType: 'arraybuffer',
        headers: { Referer: base },
        ...agent
      });

      res.setHeader('Content-Type', 'image/png');
      return res.send(img.data);

    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: 'FlowFalcon',
        message: 'Gagal generate NSFW image',
        error: err.message
      });
    }
  });
};
