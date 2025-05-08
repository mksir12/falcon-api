const { createCanvas } = require('canvas');

module.exports = function ngl(app) {
  app.get('/imagecreator/ngl', async (req, res) => {
    try {
      const title = req.query.title || 'kirimi aku pesan anonim!';
      const text = req.query.text || 'gue suka banget sama lo ❤️';

      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext('2d');

      // Gradasi atas
      const gradient = ctx.createLinearGradient(0, 0, 0, 250);
      gradient.addColorStop(0, '#f94f59');
      gradient.addColorStop(1, '#fccc63');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 200);

      // Judul
      ctx.fillStyle = 'white';
      ctx.font = 'bold 26px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 110);

      // Putih bawah
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 200, 512, 312);

      // Isi pesan
      ctx.fillStyle = 'black';
      ctx.font = '24px Arial';
      ctx.fillText(text, 256, 360);

      const buffer = canvas.toBuffer('image/png');
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (err) {
      res.status(500).send(`Error: ${err.message}`);
    }
  });
};
