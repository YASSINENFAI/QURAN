#!/usr/bin/env node
// يولّد صفحات ثابتة لكل سورة (surah/*.html) وفهرس السور وخريطة الموقع.
// التشغيل: node scripts/build-surahs.mjs [YYYY-MM-DD]
// النص من alquran.cloud (quran-uthmani) ويُكتب داخل HTML حتى تفهرسه محركات البحث دون JavaScript.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://quran-gamma-orpin.vercel.app';
const DATE = process.argv[2] || new Date().toISOString().slice(0, 10);
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = (n) => String(n).replace(/\d/g, (d) => AR[d]);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// نفس أسماء السور المستخدمة في صفحات الموقع
const html = await readFile(join(ROOT, 'index.html'), 'utf8');
const NAMES = /var NAMES='([^']+)'/.exec(html)[1].split('،');
if (NAMES.length !== 114) throw new Error('NAMES');

const slug = (s) => s.englishName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pathOf = (s) => `/surah/${s.number}-${slug(s)}.html`;
const ayahWord = (n) => (n === 1 ? 'آية واحدة' : n === 2 ? 'آيتان' : n <= 10 ? `${ar(n)} آيات` : `${ar(n)} آية`);

async function get(n) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`);
      if (r.ok) return (await r.json()).data;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error('fetch ' + n);
}

const surahs = [];
for (let n = 1; n <= 114; n++) {
  const d = await get(n);
  const ayahs = d.ayahs.map((a) => ({ n: a.numberInSurah, t: String(a.text).replace(/^\uFEFF/, '').trim(), juz: a.juz, page: a.page, sajda: !!a.sajda }));
  if (ayahs.length !== d.numberOfAyahs) throw new Error('count ' + n);
  if (n !== 1 && n !== 9 && ayahs[0].t.startsWith('بِسْمِ')) {
    const t = ayahs[0].t.split(' ').slice(4).join(' ').trim();
    if (t) ayahs[0].t = t;
  }
  surahs.push({ number: n, name: NAMES[n - 1], englishName: d.englishName, meaning: d.englishNameTranslation, type: d.revelationType === 'Meccan' ? 'مكية' : 'مدنية', count: d.numberOfAyahs, ayahs });
  process.stdout.write('.');
}
process.stdout.write('\n');

const LOGO = `<svg class="brand-mark" viewBox="0 0 64 64" role="img" aria-label="شعار مقطع آية"><rect x="1" y="1" width="62" height="62" rx="16" fill="#0B5148"/><path d="M32 9l3.4 4.1-3.4 3.4-3.4-3.4z" fill="#E3C16F"/><path d="M27 17C19 17 14 23 14 30l-4 1v7l4 2v5l15 8 3 4 3-4 15-8v-5l4-2v-7l-4-1c0-7-5-13-13-13" fill="none" stroke="#F8F9F6" stroke-width="2.7" stroke-linejoin="round"/><path d="M8 34l24 22 24-22v10L32 57 8 44z" fill="#F8F9F6"/><path d="M13 37l19 17 19-17-1 7-18 14-18-14z" fill="#E3C16F"/><g stroke="#E3C16F" stroke-width="2.7" stroke-linecap="round"><path d="M22 31v4M27 27v12M32 23v20M37 27v12M42 31v4"/></g><path d="M32 58l3 3-3 3-3-3z" fill="#E3C16F"/></svg>`;
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2314564B'/%3E%3Cpath d='M32 14l5 13 13 5-13 5-5 13-5-13-13-5 13-5z' fill='%23E3C16F'/%3E%3C/svg%3E";
const CSS = `.crumbs{font-size:14px;color:var(--mute);margin:4px 0 0}.crumbs a{color:var(--green)}
.sh{margin:6px 0 4px;font:700 clamp(30px,5vw,44px)/1.5 "Amiri Quran",serif;color:var(--green)}
.facts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 0;padding:0;list-style:none}.facts li{padding:4px 12px;border-radius:999px;background:#E4ECE6;color:var(--green2);font-size:14px}
.acts{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.mushaf{padding:24px 20px;border-radius:16px;background:#FFFDF6;border:1px solid #E7DCC0;font:400 clamp(23px,2.8vw,30px)/2.3 "Amiri Quran",serif;text-align:justify;color:#1E2B27}
.mushaf .bs{display:block;text-align:center;color:var(--brass);margin-bottom:8px}
.mushaf .n{color:var(--brass);white-space:nowrap}
.pn{display:flex;justify-content:space-between;gap:10px;margin:18px 0}.pn a{flex:1;text-align:center}
.about{color:var(--mute);line-height:1.9;max-width:860px}.about h2{color:var(--green);font-size:22px;margin:22px 0 6px}
.list{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;padding:0;list-style:none}
.list a{display:flex;justify-content:space-between;gap:8px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);text-decoration:none}
.list a:hover{border-color:var(--green)}.list small{color:var(--mute)}`;

function shell({ title, description, canonical, ld, body, current }) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${canonical}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE}${canonical}">
<meta property="og:site_name" content="مقطع آية">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ar_AR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og-image.jpg">
<meta name="theme-color" content="#14564B">
<link rel="icon" href="${ICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site.css">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header>
<nav class="sitebar" aria-label="التنقل الرئيسي">
<a class="brand" href="/" aria-label="مقطع آية - الصفحة الرئيسية">${LOGO}<span class="brand-name">مقطع آية</span></a>
</nav>
<nav class="pagenav" aria-label="صفحات الموقع">
<a href="/">🎬 صانع الفيديو</a>
<a href="/quran.html">📖 القرآن الكريم</a>
<a href="/surah/"${current === 'index' ? ' aria-current="page"' : ''}>📜 سور القرآن مكتوبة</a>
<a href="/adhkar.html">🤲 الأذكار</a>
</nav>
</header>
<main>
${body}
</main>
<footer>نص القرآن الكريم بالرسم العثماني من alquran.cloud. مقطع آية: صانع فيديو قرآني مجاني، وقراءة السور وتحميل صور الآيات.</footer>
</body>
</html>
`;
}

const crumbLd = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: SITE + it[1] })),
});

await mkdir(join(ROOT, 'surah'), { recursive: true });
for (const s of surahs) {
  const prev = surahs[s.number - 2], next = surahs[s.number];
  const juz = [...new Set(s.ayahs.map((a) => a.juz))];
  const pages = [s.ayahs[0].page, s.ayahs[s.ayahs.length - 1].page];
  const title = `سورة ${s.name} مكتوبة كاملة بالرسم العثماني | مقطع آية`;
  const description = `اقرأ سورة ${s.name} مكتوبة كاملة بالتشكيل والرسم العثماني، ${ayahWord(s.count)}، سورة ${s.type}. حمّل سورة ${s.name} صوراً أو أنشئ منها فيديو بصوت قارئك المفضل مجاناً.`;
  const first = s.ayahs.slice(0, 1)[0].t.split(' ').slice(0, 8).join(' ');
  const text = s.ayahs.map((a) => `${esc(a.t)} <span class="n">﴿${ar(a.n)}﴾</span>`).join(' ');
  const body = `<article>
<p class="crumbs"><a href="/">الرئيسية</a> › <a href="/surah/">سور القرآن الكريم</a> › سورة ${esc(s.name)}</p>
<h1 class="sh">سورة ${esc(s.name)} مكتوبة كاملة</h1>
<ul class="facts">
<li>سورة ${s.type}</li><li>${ayahWord(s.count)}</li><li>ترتيبها في المصحف: ${ar(s.number)}</li>
<li>${juz.length > 1 ? 'الأجزاء ' + juz.map(ar).join('، ') : 'الجزء ' + ar(juz[0])}</li>
<li>${pages[0] === pages[1] ? 'الصفحة ' + ar(pages[0]) : 'الصفحات ' + ar(pages[0]) + '–' + ar(pages[1])}</li>
</ul>
<div class="acts">
<a class="go" href="/quran.html#${s.number}">تحميل سورة ${esc(s.name)} صوراً</a>
<a class="mini" href="/?s=${s.number}&amp;f=1&amp;t=${s.count}">إنشاء فيديو لسورة ${esc(s.name)}</a>
</div>
<div class="mushaf">${s.number !== 1 && s.number !== 9 ? `<span class="bs">${BASMALA}</span>` : ''}${text}</div>
<nav class="pn" aria-label="السور المجاورة">
${prev ? `<a class="mini" href="${pathOf(prev)}">→ سورة ${esc(prev.name)}</a>` : '<span></span>'}
${next ? `<a class="mini" href="${pathOf(next)}">سورة ${esc(next.name)} ←</a>` : '<span></span>'}
</nav>
<section class="about">
<h2>عن سورة ${esc(s.name)}</h2>
<p>سورة ${esc(s.name)} هي السورة رقم ${ar(s.number)} في ترتيب المصحف الشريف، وهي سورة ${s.type} عدد آياتها ${ayahWord(s.count)}، تبدأ بقوله تعالى: «${esc(first)}…». ${s.number === 9 ? 'وهي السورة الوحيدة التي لا تبدأ بالبسملة. ' : ''}تجد هنا نص سورة ${esc(s.name)} مكتوباً كاملاً بالرسم العثماني مع أرقام الآيات.</p>
<h2>تحميل سورة ${esc(s.name)} صور أو فيديو</h2>
<p>يمكنك من صفحة <a href="/quran.html#${s.number}">القرآن الكريم</a> تحميل سورة ${esc(s.name)} كاملة أو أي آية منها كصورة بخلفية ومقاس تختاره، أو إنشاء <a href="/?s=${s.number}&amp;f=1&amp;t=${s.count}">فيديو قرآني لسورة ${esc(s.name)}</a> بصوت القارئ ياسر الدوسري أو ماهر المعيقلي أو عبد الرحمن السديس أو مشاري العفاسي، مجاناً ومن المتصفح مباشرة.</p>
</section>
</article>`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: title, url: SITE + pathOf(s), inLanguage: 'ar', description, isPartOf: { '@type': 'WebSite', name: 'مقطع آية', url: SITE + '/' } },
      crumbLd([['الرئيسية', '/'], ['سور القرآن الكريم', '/surah/'], ['سورة ' + s.name, pathOf(s)]]),
    ],
  };
  await writeFile(join(ROOT, pathOf(s).slice(1)), shell({ title, description, canonical: pathOf(s), ld, body }));
}

// فهرس السور
{
  const title = 'سور القرآن الكريم مكتوبة كاملة بالرسم العثماني (١١٤ سورة) | مقطع آية';
  const description = 'فهرس سور القرآن الكريم الـ١١٤ مكتوبة كاملة بالتشكيل والرسم العثماني، مع عدد الآيات ونوع كل سورة، وتحميل السور صوراً أو فيديو مجاناً.';
  const body = `<p class="crumbs"><a href="/">الرئيسية</a> › سور القرآن الكريم</p>
<h1 class="sh">سور القرآن الكريم مكتوبة</h1>
<p class="about">اختر سورة لقراءتها مكتوبة كاملة بالرسم العثماني، ثم حمّلها صوراً أو أنشئ منها فيديو.</p>
<ul class="list">${surahs.map((s) => `<li><a href="${pathOf(s)}"><span>${ar(s.number)}. سورة ${esc(s.name)}</span><small>${s.type} • ${ayahWord(s.count)}</small></a></li>`).join('')}</ul>`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: title, url: SITE + '/surah/', inLanguage: 'ar', description },
      crumbLd([['الرئيسية', '/'], ['سور القرآن الكريم', '/surah/']]),
      { '@type': 'ItemList', itemListElement: surahs.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + pathOf(s), name: 'سورة ' + s.name })) },
    ],
  };
  await writeFile(join(ROOT, 'surah/index.html'), shell({ title, description, canonical: '/surah/', ld, body, current: 'index' }));
}

// خريطة الموقع
const urls = [['/', '1.0', 'weekly'], ['/quran.html', '0.9', 'weekly'], ['/adhkar.html', '0.9', 'monthly'], ['/surah/', '0.9', 'monthly'], ...surahs.map((s) => [pathOf(s), '0.8', 'yearly'])];
await writeFile(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p, c]) => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>${c}</changefreq>\n    <priority>${p}</priority>\n  </url>`).join('\n')}
</urlset>
`);
console.log('wrote', surahs.length, 'surah pages');
