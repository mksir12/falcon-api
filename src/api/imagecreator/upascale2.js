const axios = require("axios");
const FormData = require("form-data");
const multer = require("multer");
const upload = multer();
const { read } = require("image-size"); // opsional buat cek validasi
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function upscale(buffer, scale = 4) {
  const form = new FormData();
  form.append("myfile", buffer, `file-${Date.now()}.png`);
  form.append("scaleRadio", scale);

  const uploadRes = await axios.post("https://get1.imglarger.com/api/UpscalerNew/UploadNew", form, {
    headers: {
      ...form.getHeaders(),
      Referer: "https://imgupscaler.com/"
    }
  });

  const payload = {
    code: uploadRes.data.data.code,
    scaleRadio: scale
  };

  let success = false;
  let result;
  while (!success) {
    const check = await axios.post("https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew", JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://imgupscaler.com/"
      }
    });

    if (check.data.status === "success") {
      success = true;
      result = check.data;
    } else {
      await delay(5000);
    }
  }

  return result;
}

module.exports = function (app) {
  // GET via URL
  app.get("/tools/upscale-v2", async (req, res) => {
    const { url, scale = 4 } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' wajib diisi" });

    try {
      const { data } = await axios.get(url, { responseType: "arraybuffer" });
      const result = await upscale(data, scale);
      res.json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });

  // POST via upload
  app.post("/tools/upscale-v2", upload.single("image"), async (req, res) => {
    const scale = parseInt(req.body.scale) || 4;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ status: false, message: "Form 'image' wajib diupload" });
    }

    try {
      const result = await upscale(file.buffer, scale);
      res.json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });
};
