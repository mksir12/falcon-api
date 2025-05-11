const axios = require("axios");
const crypto = require("crypto");

module.exports = function (app) {
  app.get("/download/savetube", async (req, res) => {
    const { link, format } = req.query;

    const formatVideo = ['144', '240', '360', '480', '720', '1080', '1440', '2k', '3k', '4k', '5k', '8k'];
    const formatAudio = ['mp3', 'm4a', 'webm', 'aac', 'flac', 'opus', 'ogg', 'wav'];
    const allFormats = [...formatVideo, ...formatAudio];

    const api = {
      base: "https://media.savetube.me/api",
      cdn: "/random-cdn",
      info: "/v2/info",
      download: "/download"
    };

    const headers = {
      'accept': '*/*',
      'content-type': 'application/json',
      'origin': 'https://yt.savetube.me',
      'referer': 'https://yt.savetube.me/',
      'user-agent': 'Postify/1.0.0'
    };

    function isUrl(str) {
      try {
        new URL(str);
        return true;
      } catch (_) {
        return false;
      }
    }

    function youtube(url) {
      const patterns = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/
      ];
      for (let p of patterns) {
        if (p.test(url)) return url.match(p)[1];
      }
      return null;
    }

    async function hexToBuffer(hexString) {
      return Buffer.from(hexString.match(/.{1,2}/g).join(''), 'hex');
    }

    async function decrypt(enc) {
      const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
      const data = Buffer.from(enc, 'base64');
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = await hexToBuffer(secretKey);
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      let decrypted = decipher.update(content);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(decrypted.toString());
    }

    async function request(endpoint, data = {}, method = 'post') {
      try {
        const { data: response } = await axios({
          method,
          url: `${endpoint.startsWith('http') ? '' : api.base}${endpoint}`,
          data: method === 'post' ? data : undefined,
          params: method === 'get' ? data : undefined,
          headers
        });
        return { status: true, code: 200, data: response };
      } catch (error) {
        return {
          status: false,
          code: error.response?.status || 500,
          error: error.message
        };
      }
    }

    // === Start logic ===
    if (!link || !format)
      return res.status(400).json({ status: false, message: "Param 'link' & 'format' wajib diisi" });

    if (!isUrl(link))
      return res.status(400).json({ status: false, message: "Itu bukan link youtube kocak" });

    if (!allFormats.includes(format))
      return res.status(400).json({ status: false, message: "Format nggak didukung", available: allFormats });

    const id = youtube(link);
    if (!id)
      return res.status(400).json({ status: false, message: "Link youtube nggak valid" });

    try {
      const cdnResp = await request(api.cdn, {}, 'get');
      if (!cdnResp.status) return res.status(500).json(cdnResp);

      const cdn = cdnResp.data.cdn;
      const infoResp = await request(`https://${cdn}${api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`
      });

      if (!infoResp.status) return res.status(500).json(infoResp);

      const decrypted = await decrypt(infoResp.data.data);
      const type = formatAudio.includes(format) ? 'audio' : 'video';

      const dlResp = await request(`https://${cdn}${api.download}`, {
        id,
        downloadType: type,
        quality: type === 'audio' ? '128' : format,
        key: decrypted.key
      });

      if (!dlResp.status) return res.status(500).json(dlResp);

      res.json({
        status: true,
        result: {
          title: decrypted.title || "Gak tau",
          type,
          format,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          download: dlResp.data.data.downloadUrl,
          duration: decrypted.duration,
          quality: type === 'audio' ? '128' : format
        }
      });
    } catch (err) {
      res.status(500).json({ status: false, message: err.message });
    }
  });
};
