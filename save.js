/* حفظ الملفات (صور/فيديو) بطريقة تعمل على الجوال ومتصفحات التطبيقات */
(function(){
'use strict';
var ua=navigator.userAgent||'';
var IOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
var ANDROID=/Android/i.test(ua);
var MOBILE=IOS||ANDROID||/Mobi/i.test(ua);
// متصفحات داخل التطبيقات (تيليغرام، إنستغرام، فيسبوك، تيك توك…) تتجاهل روابط التحميل غالباً
var IN_APP=/FBAN|FBAV|FB_IAB|Instagram|Line\/|Telegram|Snapchat|musical_ly|Bytedance|TikTok|Twitter|MicroMessenger|; wv\)/i.test(ua)||
  (IOS&&!/Safari\//.test(ua)&&!/CriOS|FxiOS|EdgiOS/.test(ua));

function canShareFiles(files){
  try{return !!(files&&files.length&&navigator.share&&navigator.canShare&&navigator.canShare({files:files}))}catch(e){return false}
}
function toFile(blob,name){try{return new File([blob],name,{type:blob.type})}catch(e){return null}}
function anchor(url,name){
  var a=document.createElement('a');
  a.href=url;a.download=name;a.rel='noopener';a.style.display='none';
  document.body.appendChild(a);a.click();a.remove();
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function dimensions(w,h){w=Number(w);h=Number(h);return w>0&&h>0?' width="'+Math.floor(w)+'" height="'+Math.floor(h)+'"':''}

var css='.ays-ov{position:fixed;inset:0;z-index:1000;background:rgba(5,20,17,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;direction:rtl;font:500 15px/1.7 "IBM Plex Sans Arabic",system-ui,sans-serif;color:#fff;text-align:center;overflow:auto}'+
'.ays-ov img,.ays-ov video{max-width:100%;max-height:60vh;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.5);-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto}'+
'.ays-ov p{margin:0;max-width:520px}.ays-ov .ays-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}'+
'.ays-ov button,.ays-ov a{min-height:44px;padding:9px 16px;border-radius:10px;border:0;background:#fff;color:#14564B;font:600 15px "IBM Plex Sans Arabic",sans-serif;text-decoration:none;cursor:pointer}'+
'.ays-ov .ays-p{background:#E3C16F;color:#2B2116}'+
'.ays-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;width:100%;max-width:640px;max-height:52vh;overflow:auto;padding:4px}'+
'.ays-ov .ays-grid a{padding:0;min-height:0;background:none;border-radius:8px}.ays-ov .ays-grid img{width:100%;height:auto;max-height:none;border-radius:8px;display:block}'+
'.ays-toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:1001;max-width:min(560px,calc(100% - 24px));padding:12px 44px 12px 16px;border-radius:12px;background:#0E3F37;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.3);direction:rtl;font:500 14px/1.8 "IBM Plex Sans Arabic",sans-serif}'+
'.ays-toast span{opacity:.85}.ays-toast button{position:absolute;top:8px;right:8px;border:0;background:none;color:#fff;font-size:16px;cursor:pointer}'+
'.ays-bn{position:sticky;top:0;z-index:999;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;padding:9px 12px;background:#8A5A12;color:#fff;font:500 14px/1.6 "IBM Plex Sans Arabic",sans-serif;text-align:center;direction:rtl}'+
'.ays-bn button,.ays-bn a{min-height:36px;padding:5px 12px;border-radius:8px;border:0;background:#fff;color:#8A5A12;font:600 14px "IBM Plex Sans Arabic",sans-serif;text-decoration:none;cursor:pointer}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function openInBrowserHref(){
  if(ANDROID)return 'intent://'+location.host+location.pathname+location.search+location.hash+'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(location.href)+';end';
  return null;
}
function copyLink(btn){
  var done=function(){if(btn)btn.textContent='تم نسخ الرابط ✓'};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(location.href).then(done,function(){prompt('انسخ الرابط:',location.href)});
  else prompt('انسخ الرابط:',location.href);
}
function browserActions(){
  var h=openInBrowserHref();
  return (h?'<a href="'+esc(h)+'">فتح في Chrome</a>':'')+'<button type="button" data-ays="copy">نسخ رابط الموقع</button>';
}
function hint(){
  return IOS?'اضغط على زر ⋯ أو أيقونة البوصلة ثم اختر «فتح في Safari».':'اضغط على ⋮ في الأعلى ثم اختر «فتح في المتصفح» أو «فتح في Chrome».';
}

/* شريط تنبيه لمتصفحات التطبيقات */
function banner(){
  try{if(!IN_APP||sessionStorage.getItem('aysBn'))return}catch(e){if(!IN_APP)return}
  var d=document.createElement('div');d.className='ays-bn';d.setAttribute('role','alert');
  d.innerHTML='<span>أنت تفتح الموقع داخل تطبيق، وقد لا يعمل التحميل هنا. '+hint()+'</span>'+browserActions()+'<button type="button" data-ays="x" aria-label="إغلاق">✕</button>';
  d.addEventListener('click',function(e){
    var b=e.target.closest('[data-ays]');if(!b)return;
    if(b.getAttribute('data-ays')==='copy')copyLink(b);
    else{d.remove();try{sessionStorage.setItem('aysBn','1')}catch(err){}}
  });
  document.body.insertBefore(d,document.body.firstChild);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner);else banner();

/* نافذة الحفظ: معاينة (ضغط مطوّل) + حفظ في الصور + تحميل + مكان الملف بعد التحميل */
function whereTip(isVid){
  if(IOS)return 'بعد «تحميل» تجد الملف في تطبيق «الملفات» ← «التنزيلات». للحفظ في «الصور» استخدم الزر الأصفر أو '+(isVid?'زر المشاركة في مشغّل الفيديو.':'اضغط مطوّلاً على الصورة ← «إضافة إلى الصور».');
  if(ANDROID)return 'بعد «تحميل» تجد الملف في «المعرض» ← ألبوم «Download»، أو في تطبيق «الملفات» ← «التنزيلات».';
  return 'بعد «تحميل» تجد الملف في مجلد «التنزيلات» (Downloads). اضغط Ctrl+J لفتح قائمة التنزيلات.';
}
function overlay(blob,name,files,opts){
  opts=opts||{};
  var urls=[],url=URL.createObjectURL(blob);urls.push(url);
  var isVid=/^video\//.test(blob.type),isImg=/^image\//.test(blob.type),gallery=opts.gallery||null;
  var shareable=canShareFiles(files);
  var ov=document.createElement('div');
  ov.className='ays-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  var media;
  if(gallery){
    media='<p style="font-size:18px">'+esc(opts.label||'')+'</p><div class="ays-grid">'+gallery.map(function(g){
      var u=URL.createObjectURL(g.blob);urls.push(u);
      return '<a href="'+u+'" download="'+esc(g.name)+'" title="'+esc(g.name)+'"><img src="'+u+'" alt="'+esc(g.alt||'صورة من القرآن الكريم')+'"'+dimensions(g.width,g.height)+' loading="lazy" decoding="async"></a>';
    }).join('')+'</div>';
  }else media=isVid?'<video src="'+url+'" controls playsinline></video>':isImg?'<img src="'+url+'" alt="'+esc(opts.alt||'صورة من القرآن الكريم')+'"'+dimensions(opts.width,opts.height)+' decoding="async">':'<p style="font-size:18px">'+esc(opts.label||('الملف جاهز: '+name))+'</p>';
  var first=gallery?(MOBILE?'اضغط على أي صورة لتحميلها وحدها، أو اضغط عليها مطوّلاً ثم «حفظ الصورة».':'انقر على أي صورة لتحميلها وحدها، أو حمّل الكل في ملف ZIP.'):
    shareable?'الأسهل: اضغط «حفظ في الصور» ثم اختر '+(isVid?'«حفظ الفيديو»':'«حفظ الصورة»')+'.':
    isImg?(MOBILE?'اضغط مطوّلاً على الصورة ثم اختر «حفظ الصورة» أو «تنزيل الصورة».':'اضغط «تحميل»، أو انقر بالزر الأيمن على الصورة ثم «حفظ الصورة باسم».'):'';
  ov.innerHTML=media+(first?'<p>'+first+'</p>':'')+'<p style="opacity:.8;font-size:14px">'+whereTip(isVid)+'</p>'+
    (IN_APP?'<p style="opacity:.85;font-size:14px">إن لم يعمل الحفظ داخل هذا التطبيق: '+hint()+'</p>':'')+
    '<div class="ays-row">'+(shareable?'<button type="button" class="ays-p" data-ays="share">حفظ في الصور / مشاركة</button>':'')+
    '<a'+(shareable?'':' class="ays-p"')+' href="'+url+'" download="'+esc(name)+'">'+(gallery?'تحميل الكل (ZIP)':'تحميل')+'</a>'+(IN_APP?browserActions():'')+
    '<button type="button" data-ays="x">إغلاق</button></div>';
  ov.addEventListener('click',function(e){
    var b=e.target.closest('[data-ays]'),k=b&&b.getAttribute('data-ays');
    var a=e.target.closest('a[download]');
    if(a){toast(a.getAttribute('download'),isVid);return}
    if(k==='copy'){copyLink(b);return}
    // ضغطة جديدة من المستخدم، فلا تُرفض المشاركة لانتهاء مهلة التفاعل
    if(k==='share'){navigator.share({files:files}).then(function(){b.textContent='✓ تم الحفظ/المشاركة'},function(){});return}
    if(k==='x'||e.target===ov){ov.remove();setTimeout(function(){urls.forEach(function(u){URL.revokeObjectURL(u)})},120000)}
  });
  document.body.appendChild(ov);
  var focus=ov.querySelector('.ays-p');if(focus)focus.focus();
  return 'preview';
}

/* إشعار بعد التحميل يوضّح مكان الملف */
function toast(name,isVid){
  var old=document.querySelector('.ays-toast');if(old)old.remove();
  var t=document.createElement('div');t.className='ays-toast';t.setAttribute('role','status');
  t.innerHTML='<b>✓ جارٍ التحميل:</b> '+esc(name)+'<br><span>'+whereTip(isVid).replace('بعد «تحميل» ','')+'</span><button type="button" aria-label="إغلاق">✕</button>';
  t.querySelector('button').onclick=function(){t.remove()};
  document.body.appendChild(t);
  setTimeout(function(){if(t.parentNode)t.remove()},10000);
}

/**
 * زر التحميل يفتح دائماً نافذة الحفظ (على كل الأجهزة) بدل تنزيل صامت:
 * معاينة، «حفظ في الصور» حيث تتوفر المشاركة، «تحميل»، ومكان الملف بعد التحميل.
 */
function save(blob,name,alt){
  var f=toFile(blob,name);
  return Promise.resolve(overlay(blob,name,f?[f]:null,{alt:alt}));
}
/** عدة صور: معرض للصور نفسها (كل صورة قابلة للتحميل) مع زر ZIP للكل. */
function saveMany(items,fallback,fallbackName){
  var files=[];
  items.forEach(function(it){var f=toFile(it.blob,it.name);if(f)files.push(f)});
  var all=files.length===items.length?files:null;
  return Promise.resolve(overlay(fallback(),fallbackName,all,{gallery:items,label:'تم تجهيز '+items.length+' صورة'}));
}
window.AyaSave={save:save,saveMany:saveMany,inApp:IN_APP,ios:IOS,mobile:MOBILE,canShareFiles:canShareFiles};
})();
