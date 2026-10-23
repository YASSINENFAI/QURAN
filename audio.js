// Vercel serverless function: يجلب صوت الآية ويعيده من نفس النطاق لتفادي مشاكل CORS
const RECITERS = {
  yasser: 'Yasser_Ad-Dussary_128kbps',
  maher: 'Maher_AlMuaiqly_128kbps',
  sudais: 'Abdurrahmaan_As-Sudais_192kbps',
  luhaidan: 'Muhammad_Luhaidan_128kbps',
  alafasy: 'Alafasy_128kbps'
};

module.exports = async (req, res) => {
  const { r, s, a } = req.query;
  const folder = RECITERS[r];
  const surah = parseInt(s, 10);
  const ayah = parseInt(a, 10);
  if (!folder || !(surah >= 1 && surah <= 114) || !(ayah >= 1 && ayah <= 286)) {
    return res.status(400).send('bad request');
  }
  const pad = (n) => String(n).padStart(3, '0');
  const url = `https://everyayah.com/data/${folder}/${pad(surah)}${pad(ayah)}.mp3`;
  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(404).send('not found');
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).send('upstream error');
  }
};
