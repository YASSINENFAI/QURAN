// Vercel serverless function: يجلب صوت الآية ويعيده من نفس النطاق لتفادي مشاكل CORS
//
// لا يوجد أي حد لعدد الطلبات (rate limit) على هذا المسار عن قصد: الصفحة تطلب
// عشرات الآيات المتتالية (حتى 286 آية عند اختيار السورة كاملة) عبر 4 طلبات
// متوازية فقط. الاعتماد هنا على التخزين المؤقت في المتصفح وعلى شبكة Vercel
// بدلاً من تقييد الطلبات، حتى لا يفشل جلب النطاقات الطويلة في منتصفها.
const RECITERS = {
  yasser: 'Yasser_Ad-Dussary_128kbps',
  maher: 'Maher_AlMuaiqly_128kbps',
  sudais: 'Abdurrahmaan_As-Sudais_192kbps',
  luhaidan: 'Muhammad_Luhaidan_128kbps',
  alafasy: 'Alafasy_128kbps'
};

// كل مجلدات everyayah هنا بترميز ثابت، ونستفيد من الاسم لتقدير المدة من حجم الملف
const BITRATE = 128000;
function bitrateOf(folder) {
  return /192kbps/.test(folder) ? 192000 : BITRATE;
}

const AUDIO_CACHE = 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, immutable';
const META_CACHE = 'public, max-age=604800, s-maxage=31536000, stale-while-revalidate=604800, immutable';

const pad = (n) => String(n).padStart(3, '0');
function fileUrl(folder, surah, ayah) {
  return `https://everyayah.com/data/${folder}/${pad(surah)}${pad(ayah)}.mp3`;
}

// حجم الملف من ترويسة HEAD، وإن رفضها المصدر نطلب بايتاً واحداً ونقرأ الحجم الكلي
// من Content-Range. لا نُنزّل الملف كاملاً لمجرد تقدير المدة.
async function probeSize(url) {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) {
      const len = Number(head.headers.get('content-length'));
      if (len > 0) return len;
    }
  } catch (e) {}

  try {
    const ranged = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    const range = ranged.headers.get('content-range');
    if (range) {
      const m = /\/(\d+)\s*$/.exec(range);
      if (m) return Number(m[1]);
    }
    const len = Number(ranged.headers.get('content-length'));
    if (ranged.status === 200 && len > 0) return len;
  } catch (e) {}

  return 0;
}

module.exports = async (req, res) => {
  const { r, s, a, meta } = req.query;
  const folder = RECITERS[r];
  const surah = parseInt(s, 10);
  const ayah = parseInt(a, 10);
  if (!folder || !(surah >= 1 && surah <= 114) || !(ayah >= 1 && ayah <= 286)) {
    return res.status(400).send('bad request');
  }

  const url = fileUrl(folder, surah, ayah);

  // ?meta=1 → حجم الملف والترميز والمدة التقريبية، لحساب مدة النطاق قبل الإنشاء
  if (meta === '1' || meta === 'true') {
    try {
      const bytes = await probeSize(url);
      if (!bytes) return res.status(502).json({ error: 'upstream error' });
      const bitrate = bitrateOf(folder);
      res.setHeader('Cache-Control', META_CACHE);
      res.setHeader('CDN-Cache-Control', META_CACHE);
      return res.status(200).json({
        bytes,
        bitrate,
        duration: +((bytes * 8) / bitrate).toFixed(3)
      });
    } catch (e) {
      return res.status(502).json({ error: 'upstream error' });
    }
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(404).send('not found');
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Cache-Control', AUDIO_CACHE);
    res.setHeader('CDN-Cache-Control', AUDIO_CACHE);
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).send('upstream error');
  }
};
