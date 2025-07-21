const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');

module.exports = function (app) {
  app.get('/download/aio', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        creator: 'FlowFalcon',
        message: 'Parameter "url" wajib diisi'
      });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (RetatubeFetcher)',
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    };

    try {
      // Step 1: Ambil prefix & ex dari form awal
      const init = await axios.get('https://retatube.com/api/v1/aio/index?s=retatube.com', {
        headers: { 'User-Agent': headers['User-Agent'] }
      });

      const $ = cheerio.load(init.data);
      const prefix = $('input[name="prefix"]').val();
      const ex = $('input[name="ex"]').val() || '';
      const actionPath = $('button[hx-post]').attr('hx-post');

      if (!prefix || !actionPath) {
        return res.status(500).json({
          status: false,
          creator: 'FlowFalcon',
          message: 'Gagal mengambil prefix atau path dinamis'
        });
      }

      // Step 2: Kirim post request untuk generate link download
      const postUrl = 'https://retatube.com' + actionPath;
      const body = qs.stringify({ prefix, ex, vid: url, format: '' });

      const post = await axios.post(postUrl, body, { headers });

      const $$ = cheerio.load(post.data);
      const title = $$('p strong:contains("Title")').text().replace('Title：', '').trim() || '-';
      const owner = $$('p strong:contains("Owner")').parent().text().replace('Owner：', '').trim() || '-';
      const downloads = [];

      $$('a.button').each((_, el) => {
        const label = $$(el).text().trim();
        const href = $$(el).attr('href')?.trim();
        if (href?.startsWith('http')) downloads.push({ label, url: href });
      });

      if (!downloads.length) {
        return res.status(404).json({
          status: false,
          creator: 'FlowFalcon',
          message: 'Tidak ada link download ditemukan'
        });
      }

      return res.json({
        status: true,
        creator: 'FlowFalcon',
        result: {
          title,
          owner,
          downloads
        }
      });

    } catch (e) {
      return res.status(500).json({
        status: false,
        creator: 'FlowFalcon',
        message: 'Gagal scrape retatube',
        error: e.response?.data || e.message
      });
    }
  });
};
