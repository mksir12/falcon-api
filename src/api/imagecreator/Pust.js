const axios = require('axios');

module.exports = function (app) {
  app.get('/imagecreator/pustaz', async (req, res) => {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({ status: false, message: 'Parameter text wajib diisi.' });
    }

    if (text.length > 100) {
      return res.status(400).json({ status: false, message: 'Maksimal 100 karakter ya, bre!' });
    }

    try {
      const url = `https://canvas-api-seven.vercel.app/api/pust?text=${encodeURIComponent(text)}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      res.setHeader('Content-Type', 'image/png');
      res.send(response.data);
    } catch (err) {
      res.status(500).json({
        status: false,
        message: 'Gagal mengambil gambar dari API Pustaz.',
        error: err.message
      });
    }
  });
};
