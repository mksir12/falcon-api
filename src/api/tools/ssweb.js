const axios = require('axios');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = function (app) {
  app.get('/tools/ssweb', async (req, res) => {
    const { url, mode } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'Parameter url wajib diisi.' });

    const config = {
      pc: {
        w: 1280,
        h: 1200,
        s: 100,
        z: 100
      },
      mobile: {
        w: 400,
        h: 800,
        s: 100,
        z: 100
      }
    };

    const getScreenshot = async (device) => {
      const { w, h, s, z } = config[device];
      const endpoint = `https://api.pikwy.com/?tkn=125&d=3000&u=${encodeURIComponent(url)}&fs=0&w=${w}&h=${h}&s=${s}&z=${z}&f=$jpg&rt=jweb`;

      try {
        const result = await axios.get(endpoint);
        return result.data.iurl;
      } catch (err) {
        throw new Error('Gagal mengambil screenshot.');
      }
    };

    try {
      // Jika request langsung gambar
      if (mode === 'pc' || mode === 'mobile') {
        const imageUrl = await getScreenshot(mode);
        const imageBuffer = await (await fetch(imageUrl)).arrayBuffer();
        return res.setHeader('Content-Type', 'image/jpeg').send(Buffer.from(imageBuffer));
      }

      // Jika mode json (default)
      const pc = await getScreenshot('pc');
      const mobile = await getScreenshot('mobile');

      return res.json({
        status: true,
        creator: 'FlowFalcon',
        result: {
          pc,
          mobile
        }
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil screenshot.',
        error: e.message
      });
    }
  });
};
