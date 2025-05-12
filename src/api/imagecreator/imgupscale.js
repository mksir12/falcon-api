const axios = require("axios");
const FormData = require("form-data");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function upscaleByUrl(buffer, scale = 4) {
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
  return result.resultImageUrl;
}

module.exports = function (app) {
  app.get("/imagecreator/imgupscale", async (req, res) => {
    const { url, scale = 4 } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'url' wajib diisi!"
      });
    }

    try {
      const buffer = await getBuffer(url);
      const resultUrl = await upscaleByUrl(buffer, scale);
      res.status(200).json({
        status: true,
        result: resultUrl
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Gagal melakukan upscaling",
        error: e.message
      });
    }
  });
};
