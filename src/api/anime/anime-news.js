const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
  app.get("/anime/beritaanime", async (req, res) => {
    const url = 'https://www.kaorinusantara.or.id/rubrik/aktual/anime';

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const results = [];

      $('.td_module_wrap.td-animation-stack').each((i, el) => {
        const title = $(el).find('.entry-title').text().trim();
        const link = $(el).find('.entry-title a').attr('href');
        const date = $(el).find('.entry-date').text().trim();

        const imgEl = $(el).find('img');
        const image = imgEl.attr('src') || 
                      imgEl.attr('data-src') || 
                      imgEl.attr('data-lazy-src') || 
                      imgEl.attr('data-img-url') || 
                      'No Image';

        results.push({ title, image, date, url: link });
      });

      res.json({
        status: true,
        creator: "FlowFalcon",
        result: results
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal mengambil berita anime.",
        error: err.message
      });
    }
  });
};
