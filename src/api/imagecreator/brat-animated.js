module.exports = function app (app) {
  app.get('/imagecreator/brat/animate', async (req, res) => {
    try {
      const { text } = req.query;
      const gifBuffer = await getBuffer(`https://brat.caliphdev.com/api/brat/animate?text=${encodeURIComponent(text)}`);
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': gifBuffer.length,
      });
      res.end(gifBuffer);
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  });
}
