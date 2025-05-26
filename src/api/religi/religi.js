import { getPrayerTimesByDay, getPrayerTimesByMonth, getCityList } from 'naruyaizumi';
import moment from 'moment';

export default function (app) {
  // Endpoint utama: harian / bulanan / cari daerah
  app.get('/religi/jadwal', async (req, res) => {
    const { id, daerah, month, year } = req.query;

    // Cari ID berdasarkan nama daerah
    if (daerah && !id) {
      const cities = await getCityList();
      const found = cities.find(c =>
        c.lokasi.toLowerCase().includes(daerah.toLowerCase()) ||
        c.id.toLowerCase() === daerah.toLowerCase()
      );

      if (!found) {
        return res.status(404).json({
          status: false,
          message: `Daerah '${daerah}' tidak ditemukan`
        });
      }

      return res.json({
        status: true,
        message: "ID lokasi ditemukan",
        id: found.id,
        nama: found.lokasi
      });
    }

    // Validasi ID
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'id' atau 'daerah' wajib diisi"
      });
    }

    try {
      // Bulanan
      if (month && year) {
        const prayer = await getPrayerTimesByMonth(id, year, month);
        if (!prayer || prayer.length === 0) {
          return res.status(404).json({ status: false, message: "Data tidak ditemukan" });
        }

        const result = prayer.map(p => ({
          tanggal: p.date.gregorian,
          hijriah: p.date.hijri,
          daerah: p.meta.name,
          waktu: {
            imsak: p.timings.Imsak,
            subuh: p.timings.Fajr,
            terbit: p.timings.Sunrise,
            dhuha: p.timings.Dhuha,
            dzuhur: p.timings.Dhuhr,
            ashar: p.timings.Asr,
            maghrib: p.timings.Maghrib,
            isya: p.timings.Isha
          }
        }));

        return res.json({
          status: true,
          lokasi: prayer[0].meta.name,
          bulan: month,
          tahun: year,
          total: result.length,
          result
        });
      }

      // Harian
      const today = moment().format('YYYY-MM-DD');
      const prayer = await getPrayerTimesByDay(id, today);

      return res.json({
        status: true,
        tanggal: today,
        lokasi: prayer.meta.name,
        hijriah: prayer.date.hijri,
        waktu: {
          imsak: prayer.timings.Imsak,
          subuh: prayer.timings.Fajr,
          terbit: prayer.timings.Sunrise,
          dhuha: prayer.timings.Dhuha,
          dzuhur: prayer.timings.Dhuhr,
          ashar: prayer.timings.Asr,
          maghrib: prayer.timings.Maghrib,
          isya: prayer.timings.Isha
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal mengambil jadwal",
        error: err.message
      });
    }
  });

  // Endpoint daftar semua daerah
  app.get('/religi/daerah', async (req, res) => {
    try {
      const cities = await getCityList();
      const result = cities.map(c => ({
        id: c.id,
        nama: c.lokasi
      }));

      res.json({
        status: true,
        total: result.length,
        result
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Gagal mengambil daftar daerah",
        error: err.message
      });
    }
  });
}
