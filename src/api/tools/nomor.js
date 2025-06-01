const axios = require('axios');
const cheerio = require('cheerio');

async function cekNomor(nomor, conn) {
  const cleanNomor = nomor.replace(/\D/g, '').replace(/^0/, '62');
  const prefix = cleanNomor.slice(0, 7);

  // ✅ Cek dari web lokal
  let lokalInfo = {};
  try {
    const { data } = await axios.get(`https://carikartu.com/prefix/${prefix}`);
    const $ = cheerio.load(data);
    const operator = $('table tr:contains("Operator") td:last-child').text().trim();
    const lokasi = $('table tr:contains("Wilayah") td:last-child').text().trim();
    const tipe = $('table tr:contains("Jenis Kartu") td:last-child').text().trim();

    if (operator) {
      lokalInfo = { operator, lokasi, tipe };
    }
  } catch (_) {
    lokalInfo = {};
  }

  // ✅ Cek WhatsApp
  let whatsapp = '❌ Tidak Terdaftar';
  try {
    const [res] = await conn.onWhatsApp(`${cleanNomor}@s.whatsapp.net`);
    if (res?.exists) whatsapp = '✅ Terdaftar';
  } catch (_) {
    whatsapp = '❓ Tidak Diketahui';
  }

  // ✅ API Fallback (Veriphone)
  let apiInfo = {};
  try {
    const { data } = await axios.get(`https://veriphone.p.rapidapi.com/verify`, {
      params: { phone: `+${cleanNomor}` },
      headers: {
        'X-RapidAPI-Key': 'a280098fddmshcb96ed9e045e5e4p14d75ajsn435576930c6e',
        'X-RapidAPI-Host': 'veriphone.p.rapidapi.com'
      }
    });
    apiInfo = {
      negara: data.country || 'Indonesia',
      operator: data.carrier,
      tipe: data.phone_type,
      valid: data.phone_valid
    };
  } catch (_) {
    apiInfo = {};
  }

  return {
    nomor: cleanNomor,
    operator: lokalInfo.operator || apiInfo.operator || 'Tidak diketahui',
    lokasi: lokalInfo.lokasi || 'Tidak diketahui',
    tipe: lokalInfo.tipe || apiInfo.tipe || 'Tidak diketahui',
    negara: apiInfo.negara || 'Indonesia',
    valid: typeof apiInfo.valid === 'boolean' ? apiInfo.valid : 'Tidak diketahui',
    whatsapp
  };
}

module.exports = function (app, conn) {
  app.get('/tools/ceknomor', async (req, res) => {
    const { nomor } = req.query;
    if (!nomor) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'nomor' wajib diisi"
      });
    }

    try {
      const result = await cekNomor(nomor, conn);
      res.json({
        status: true,
        result
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: 'Gagal memeriksa nomor',
        error: err.message
      });
    }
  });
};
