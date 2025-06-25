const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/download/pinterest", async (req, res) => {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'url' wajib diisi (link Pinterest)"
      });
    }

    try {
      const homeUrl = "https://pinterestdownloader.com/ID";
      const homeRes = await axios.get(homeUrl);
      const jantung = {
        "cookie": homeRes.headers["set-cookie"]?.map(x => x.split(";")[0]).join("; ") || "",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://pinterestdownloader.com",
        "referer": homeUrl
      };

      const bodyUrl = new URLSearchParams({ url }).toString();
      const resFirst = await axios.post(homeUrl, bodyUrl, { headers: jantung });
      let html = resFirst.data;
      let processId = html.match(/process_id[\"']?\s*:\s*[\"']([a-f0-9\-]+)[\"']/i)?.[1]
        || cheerio.load(html)('input[name="process_id"]').attr("value");
      let resultHtml = html;

      if (processId) {
        let start = Date.now();
        while (Date.now() - start < 300000) {
          const bodyProcess = new URLSearchParams({ process_id: processId }).toString();
          const resPoll = await axios.post(homeUrl, bodyProcess, { headers: jantung });
          resultHtml = resPoll.data;
          if (!/we are working on/i.test(resultHtml)) break;
          await new Promise(r => setTimeout(r, 3000));
        }
        if (/we are working on/i.test(resultHtml)) {
          return res.status(500).json({
            status: false,
            message: "Proses terlalu lama, server Pinterest masih memproses"
          });
        }
      }

      const $ = cheerio.load(resultHtml);
      const resultMap = {};

      $('a.download__btn').each((_, el) => {
        const btn = $(el), href = btn.attr('href'), text = btn.text();
        let quality = text.match(/(hd|\d+p|\d{3}p)/i)?.[1]?.toUpperCase() || "unknown";
        let type = text.toLowerCase().includes('force') ? "force" : "direct";
        let key = `image_${quality}`;
        if (!resultMap[key]) resultMap[key] = { tag: "image", quality };
        resultMap[key][type] = href;
      });

      $('a.download_button').each((_, el) => {
        const btn = $(el), href = btn.attr('href'), text = btn.text();
        if (/video/i.test(text)) {
          let type = text.toLowerCase().includes('force') ? "force" : "direct";
          let key = `video_unknown`;
          if (!resultMap[key]) resultMap[key] = { tag: "video" };
          resultMap[key][type] = href;
        }
        if (/\.gif($|\?)/i.test(href)) {
          let type = text.toLowerCase().includes('force') ? "force" : "direct";
          let key = `gif_${href.split("/").pop()}`;
          if (!resultMap[key]) resultMap[key] = { tag: "gif" };
          resultMap[key][type] = href;
        }
      });

      const results = Object.values(resultMap);
      if (!results.length) {
        return res.status(404).json({
          status: false,
          message: "Gagal mendapatkan list link download dari Pinterest."
        });
      }

      res.json({
        status: true,
        creator: "FlowFalcon",
        results
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Gagal memproses scrape Pinterest.",
        error: e.response?.data || e.message
      });
    }
  });
};
