const axios = require('axios');
const cookiesJson =[
    {
        "domain": ".pixiv.net",
        "expirationDate": 1765798907.255479,
        "hostOnly": false,
        "httpOnly": true,
        "name": "privacy_policy_notification",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "0"
    },
    {
        "domain": "www.pixiv.net",
        "expirationDate": 1752838907.253538,
        "hostOnly": true,
        "httpOnly": false,
        "name": "webp_available",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "1"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1750247834.840168,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__cf_bm",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "HtD7nVM8.n0d1mjKIpSdaLixNHqmkkh6I0Sus8mIFMg-1750246036-1.0.1.1-pnQo1aXDmxxRvM0c6.D7yuUDxCUSLSJdlCuWLJLFfPWrwvjnZ5JJKx8n1E06FXm8kT2yDVfKH0FKJhjIp2UtY5MphAVou0Uf10pLTj0qru_0LWiJ8fRAN0oYX9wxanKf"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1756268529.642812,
        "hostOnly": false,
        "httpOnly": false,
        "name": "p_ab_d_id",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "499091053"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1756268529.642608,
        "hostOnly": false,
        "httpOnly": false,
        "name": "p_ab_id",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "3"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1752838907.254464,
        "hostOnly": false,
        "httpOnly": true,
        "name": "PHPSESSID",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "112420207_M3FVkYELdYI5Bfs7YBKi2yO1WRzFI6Vl"
    },
    {
        "domain": ".pixiv.net",
        "hostOnly": false,
        "httpOnly": true,
        "name": "_cfuvid",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": true,
        "storeId": null,
        "value": "9eVXCDGuBquJjW11EuehKkzkXhzbxijt43XLQP4h1D4-1750246908709-0.0.1.1-604800000"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1750434127.6257,
        "hostOnly": false,
        "httpOnly": true,
        "name": "device_token",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "ed2e4265a2ccca0a64c86794190b5fc4"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1765798907.255817,
        "hostOnly": false,
        "httpOnly": false,
        "name": "a_type",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "0"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1765798907.256125,
        "hostOnly": false,
        "httpOnly": false,
        "name": "b_type",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "2"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1765798907.254197,
        "hostOnly": false,
        "httpOnly": false,
        "name": "c_type",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "20"
    },
    {
        "domain": "www.pixiv.net",
        "expirationDate": 1756268529.641809,
        "hostOnly": true,
        "httpOnly": false,
        "name": "first_visit_datetime",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "2025-02-28%2013%3A22%3A09"
    },
    {
        "domain": "www.pixiv.net",
        "expirationDate": 1756268538.772894,
        "hostOnly": true,
        "httpOnly": false,
        "name": "first_visit_datetime_pc",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "2025-02-28%2013%3A22%3A19"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1756268529.642709,
        "hostOnly": false,
        "httpOnly": false,
        "name": "p_ab_id_2",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "7"
    },
    {
        "domain": ".pixiv.net",
        "expirationDate": 1763394127.625924,
        "hostOnly": false,
        "httpOnly": true,
        "name": "privacy_policy_agreement",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "7"
    },
    {
        "domain": "www.pixiv.net",
        "expirationDate": 1756268564.970637,
        "hostOnly": true,
        "httpOnly": false,
        "name": "yuid_b",
        "path": "/",
        "sameSite": null,
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "lnB4Q0A"
    }
];

function formatCookiesForHeader(cookies) {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}
const PIXIV_COOKIE = formatCookiesForHeader(cookiesJson);

const headers = {
  'Referer': 'https://www.pixiv.net/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Cookie': PIXIV_COOKIE
};

async function pixivSearch(query) {
  try {
    const { data } = await axios.get(`https://www.pixiv.net/touch/ajax/tag_portal?word=${encodeURIComponent(query)}&lang=en`, { headers });
    return data.body?.illusts || [];
  } catch {
    return [];
  }
}

async function getImageBuffer(url) {
  try {
    const res = await axios.get(url, {
      headers,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch {
    return null;
  }
}

module.exports = function (app) {
  // Search Pixiv
  app.get('/anime/pixiv', async (req, res) => {
    const { q, image } = req.query;
    if (!q) return res.status(400).json({ status: false, message: "Parameter 'q' wajib diisi." });

    const illusts = await pixivSearch(q);
    if (!illusts.length) return res.status(404).json({ status: false, message: 'Tidak ditemukan.' });

    const top = illusts[0];
    const id = top.id;

    if (image === "true") {
      const buffer = await getImageBuffer(top.url_s);
      if (!buffer) return res.status(500).json({ status: false, message: 'Gagal mengambil gambar.' });
      res.setHeader('Content-Type', 'image/jpeg');
      return res.send(buffer);
    }

    res.json({
      status: true,
      creator: 'FlowFalcon',
      result: {
        title: top.title,
        author: top.userName,
        image_api: `/anime/pixiv/image?id=${id}`
      }
    });
  });

  // Ambil gambar berdasarkan ID
  app.get('/anime/pixiv/image', async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ status: false, message: "Parameter 'id' wajib diisi." });

    try {
      const { data } = await axios.get(`https://www.pixiv.net/ajax/illust/${id}/pages`, { headers });
      const imageUrl = data.body?.[0]?.urls?.regular;
      if (!imageUrl) return res.status(404).json({ status: false, message: 'Gambar tidak ditemukan.' });

      const buffer = await getImageBuffer(imageUrl);
      if (!buffer) return res.status(500).json({ status: false, message: 'Gagal mengunduh gambar.' });

      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ status: false, message: 'Terjadi kesalahan.', error: err.message });
    }
  });
};
