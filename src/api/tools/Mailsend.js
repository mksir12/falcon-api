const axios = require('axios');
const FormData = require('form-data');

module.exports = function (app) {
  app.get('/tools/mailsend', async (req, res) => {
    const { email, subject, message, base } = req.query;

    if (!email || !subject || !message) {
      return res.status(400).json({
        status: false,
        creator: 'FlowFalcon',
        message: 'Parameter email, subject, dan message wajib diisi.'
      });
    }

    // Pilih sender
    const options = [
      'noreply@cloudku.click',
      'noreply@cloudkuimages.guru',
      'sender@cloudku.click',
      'sender@cloudkuimages.guru'
    ];

    let fromEmail;
    if (base && [1, 2, 3, 4].includes(parseInt(base))) {
      fromEmail = options[parseInt(base) - 1];
    } else {
      fromEmail = options[Math.floor(Math.random() * options.length)];
    }

    try {
      const formData = new FormData();
      formData.append('to', email);
      formData.append('from_email', fromEmail);
      formData.append('subject', subject);
      formData.append('body', message);
      formData.append('is_html', 'false');

      const { data } = await axios.post(
        'https://emailku.cloudku.click/api/sender.php',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'accept': '*/*',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'sec-ch-ua': "'Not-A.Brand';v='9', 'Chromium';v='124'",
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': "'Android'",
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
          },
          referrer: 'https://emailku.cloudku.click/',
          referrerPolicy: 'strict-origin-when-cross-origin'
        }
      );

      if (data?.status !== 'success') {
        return res.status(500).json({
          status: false,
          creator: 'FlowFalcon',
          message: 'Gagal mengirim email',
          result: data
        });
      }

      res.json({
        status: true,
        creator: 'FlowFalcon',
        original: 'https://emailku.cloudku.click/',
        Owner: 'Alfidev',
        result: data.data
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: 'FlowFalcon',
        message: 'Terjadi error saat mengirim email',
        error: err.message
      });
    }
  });
};
