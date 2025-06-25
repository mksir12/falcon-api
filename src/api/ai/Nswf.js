const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ProxyAgent = require('@rynn-k/proxy-agent');

module.exports = function (app) {
  const proxy = new ProxyAgent(path.join(__dirname, 'proxies.txt'), { random: true });

  function getRandomUA() {
    const file = path.join(__dirname, 'ua.txt');
    const lines = fs.readFileSync(file, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error('User-Agent list kosong');
    return lines[Math.floor(Math.random() * lines.length)];
  }

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
      return res.status(400).json({ status: false, creator: 'FlowFalcon', message: 'Parameter prompt wajib diisi' });
    }

    const validStyles = ['anime', 'real', 'photo'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({ status: false, creator: 'FlowFalcon', message: `Style harus salah satu dari: ${validStyles.join(', ')}` });
    }

    try {
      const agent = proxy.config();
      const ua = getRandomUA();
      const session_hash = Math.random().toString(36).slice(2);
      const base = `https://heartsync-nsfw-uncensored${style !== 'anime' ? `-${style}` : ''}.hf.space`;

      const negative_prompt = 'lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, cropped, worst quality, low quality, watermark, blurry';

      console.log(`[🔗] Using Proxy: ${agent.httpsAgent.proxy?.href || '[Custom Proxy]'}`);
      console.log(`[🛡️] User-Agent: ${ua}`);

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
      }, {
        ...agent,
        headers: {
          'User-Agent': ua,
        }
      });

      // Step 2: Poll result (maks 15 detik)
      let result = null;
      const start = Date.now();
      const timeout = 15 * 1000;

      while (Date.now() - start < timeout) {
        const { data: stream } = await axios.get(`${base}/gradio_api/queue/data?session_hash=${session_hash}`, {
          ...agent,
          headers: { 'User-Agent': ua },
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

      // Step 3: Get final image
      const img = await axios.get(result, {
        responseType: 'arraybuffer',
        headers: { 'Referer': base, 'User-Agent': ua },
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
