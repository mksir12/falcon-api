const axios = require('axios');
const QRCode = require('qrcode');

function padLength(length) {
  return length.toString().padStart(2, '0');
}

function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

async function decodeQRFromZXing(imageURL) {
  const { data } = await axios.get(`https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(imageURL)}`);
  const code = data?.[0]?.symbol?.[0]?.data;
  if (!code) throw new Error("Gagal membaca QR dari gambar.");
  return code;
}

module.exports = function (app) {
  app.get("/tools/qris2dynamic", async (req, res) => {
    const { qris, amount, tax } = req.query;
    if (!qris || !amount) {
      return res.status(400).json({ status: false, message: "Parameter 'qris' dan 'amount' wajib diisi" });
    }

    try {
      const raw = await decodeQRFromZXing(qris);
      const fixed = raw.replace("010211", "010212").slice(0, -4);
      const [left, right] = fixed.split("5802ID");

      const nominal = "54" + padLength(amount.length) + amount;

      let taxTag = "";
      if (tax) {
        if (tax.endsWith("r")) {
          const val = tax.replace("r", "").trim();
          taxTag = "55020256" + padLength(val.length) + val;
        } else if (tax.endsWith("%")) {
          const val = tax.replace("%", "").trim();
          taxTag = "55020357" + padLength(val.length) + val;
        }
      }

      const fullData = left + nominal + taxTag + "5802ID" + right;
      const final = fullData + convertCRC16(fullData);

      const qrImage = await QRCode.toBuffer(final);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': qrImage.length });
      res.end(qrImage);
    } catch (e) {
      res.status(500).json({ status: false, message: "Gagal memproses QRIS", error: e.message });
    }
  });
};
