// Vercel serverless function: يجلب صوت الآية ويعيده من نفس النطاق لتفادي مشاكل CORS
//
// لا يوجد أي حد لعدد الطلبات (rate limit) على هذا المسار عن قصد: الصفحة تطلب
// عشرات الآيات المتتالية (حتى 286 آية عند اختيار السورة كاملة) عبر 4 طلبات
// متوازية فقط. الاعتماد هنا على التخزين المؤقت في المتصفح وعلى شبكة Vercel
// بدلاً من تقييد الطلبات، حتى لا يفشل جلب النطاقات الطويلة في منتصفها.
const RECITERS = {
  yasser: 'Yasser_Ad-Dussary_128kbps',
  maher: 'MaherAlMuaiqly128kbps',
  sudais: 'Abdurrahmaan_As-Sudais_192kbps',
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
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const { r, s, a, meta } = req.query;
  const folder = typeof r === 'string' ? RECITERS[r] : null;
  // Accept only canonical positive integers; parseInt alone would accept values such as "2abc".
  if (typeof s !== 'string' || !/^\d{1,3}$/.test(s) ||
      typeof a !== 'string' || !/^\d{1,3}$/.test(a) ||
      !folder || (meta !== undefined && meta !== '1' && meta !== 'true')) {
    return res.status(400).json({ error: 'invalid parameters' });
  }
  const surah = Number(s);
  const ayah = Number(a);
  const AYAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 ||
      !Number.isInteger(ayah) || ayah < 1 || ayah > AYAH_COUNTS[surah - 1]) {
    return res.status(400).json({ error: 'invalid verse' });
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
