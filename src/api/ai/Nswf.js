const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

module.exports = function (app) {
  const proxyFile = path.join(__dirname, 'ploxy.txt');
  const uaFile = path.join(__dirname, 'ua.txt');

  function getRandomProxy() {
    const proxies = fs.readFileSync(proxyFile, 'utf-8')
      .split('\n')
      .map(x => x.trim())
      .filter(x => x.startsWith('http'));
    if (!proxies.length) throw new Error('Proxy list kosong');
    return proxies[Math.floor(Math.random() * proxies.length)];
  }

  function getRandomUA() {
    const uas = fs.readFileSync(uaFile, 'utf-8')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
    if (!uas.length) throw new Error('User-Agent kosong');
    return uas[Math.floor(Math.random() * uas.length)];
  }

  app.get('/nsfw/agent', async (req, res) => {
    const { prompt, style = 'anime' } = req.query;
    if (!prompt) return res.status(400).json({ status: false, message: 'Prompt wajib diisi' });

    const validStyles = ['anime', 'real', 'photo'];
    if (!validStyles.includes(style)) return res.status(400).json({ status: false, message: 'Style tidak valid' });

    try {
      const proxy = getRandomProxy();
      const userAgent = getRandomUA();
      const httpsAgent = new HttpsProxyAgent(proxy);
      const base = `https://heartsync-nsfw-uncensored${style !== 'anime' ? `-${style}` : ''}.hf.space`;
      const session_hash = Math.random().toString(36).slice(2);

      await axios.post(`${base}/gradio_api/queue/join`, {
        data: [prompt, 'bad anatomy, blurry, watermark', 0, true, 1024, 1024, 7, 28],
        event_data: null,
        fn_index: 2,
        trigger_id: 16,
        session_hash
      }, {
        httpsAgent,
        headers: { 'User-Agent': userAgent }
      });

      const { data: stream } = await axios.get(`${base}/gradio_api/queue/data?session_hash=${session_hash}`, {
        httpsAgent,
        headers: { 'User-Agent': userAgent },
        responseType: 'text'
      });

      const lines = stream.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const json = JSON.parse(line.slice(6));
          const url = json.output?.data?.[0]?.url;
          if (url) {
            const img = await axios.get(url, {
              responseType: 'arraybuffer',
              headers: { 'Referer': base, 'User-Agent': userAgent },
              httpsAgent
            });
            res.setHeader('Content-Type', 'image/png');
            return res.send(img.data);
          }
        }
      }

      return res.status(500).json({ status: false, message: 'Gagal ambil gambar dari server' });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: 'Gagal generate image',
        error: err.message
      });
    }
  });
};
