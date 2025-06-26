const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

module.exports = function (app) {
  // Ambil proxy acak dari file
  function getRandomProxy() {
    const proxies = fs.readFileSync(path.join(__dirname, 'ploxy.txt'), 'utf-8')
      .split('\n')
      .map(p => p.trim())
      .filter(p => p && p.startsWith('http'));

    if (!proxies.length) throw new Error('Proxy error');
    const random = proxies[Math.floor(Math.random() * proxies.length)];
    return random;
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
      return res.status(400).json({
        status: false,
        creator: 'FlowFalcon',
        message: 'Parameter "prompt" wajib diisi.'
      });
    }

    const styles = ['anime', 'real', 'photo'];
    if (!styles.includes(style)) {
      return res.status(400).json({
        status: false,
        creator: 'FlowFalcon',
        message: `Style tidak valid. Pilih salah satu: ${styles.join(', ')}`
      });
    }

    const base = `https://heartsync-nsfw-uncensored${style !== 'anime' ? `-${style}` : ''}.hf.space`;
    const session_hash = Math.random().toString(36).slice(2);
    const negative_prompt = 'lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, cropped, worst quality, low quality, watermark, blurry';

    let proxy;
    try {
      proxy = getRandomProxy();
      console.log(`[🔁] Menggunakan proxy: ${proxy}`);
    } catch (e) {
      return res.status(500).json({ status: false, message: e.message });
    }

    const httpsAgent = new HttpsProxyAgent(proxy);

    try {
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
      }, { httpsAgent, timeout: 25000 });

      // Step 2: Polling max 8x (16 detik)
      let resultUrl = null;
      for (let i = 0; i < 8; i++) {
        const { data: raw } = await axios.get(`${base}/gradio_api/queue/data?session_hash=${session_hash}`, {
          httpsAgent,
          timeout: 15000,
          responseType: 'text'
        });

        const lines = raw.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const json = JSON.parse(line.slice(6));
            if (json.msg === 'process_completed') {
              resultUrl = json.output?.data?.[0]?.url;
              break;
            }
          }
        }

        if (resultUrl) break;
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!resultUrl) {
        return res.status(500).json({
          status: false,
          creator: 'FlowFalcon',
          message: 'Gagal mendapatkan gambar dari server (Timeout)'
        });
      }

      // Step 3: Ambil gambar
      const img = await axios.get(resultUrl, {
        httpsAgent,
        responseType: 'arraybuffer',
        headers: { Referer: base }
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
