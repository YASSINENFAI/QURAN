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

var css='.ays-ov{position:fixed;inset:0;z-index:1000;background:rgba(5,20,17,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;direction:rtl;font:500 15px/1.7 "IBM Plex Sans Arabic",system-ui,sans-serif;color:#fff;text-align:center;overflow:auto}'+
'.ays-ov img,.ays-ov video{max-width:100%;max-height:60vh;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.5);-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto}'+
'.ays-ov p{margin:0;max-width:520px}.ays-ov .ays-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}'+
'.ays-ov button,.ays-ov a{min-height:44px;padding:9px 16px;border-radius:10px;border:0;background:#fff;color:#14564B;font:600 15px "IBM Plex Sans Arabic",sans-serif;text-decoration:none;cursor:pointer}'+
'.ays-ov .ays-p{background:#E3C16F;color:#2B2116}'+
'.ays-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;width:100%;max-width:640px;max-height:52vh;overflow:auto;padding:4px}'+
'.ays-ov .ays-grid a{padding:0;min-height:0;background:none;border-radius:8px}.ays-ov .ays-grid img{width:100%;max-height:none;border-radius:8px;display:block}'+
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
      return '<a href="'+u+'" download="'+esc(g.name)+'" title="'+esc(g.name)+'"><img src="'+u+'" alt="'+esc(g.name)+'" loading="lazy"></a>';
    }).join('')+'</div>';
  }else media=isVid?'<video src="'+url+'" controls playsinline></video>':isImg?'<img src="'+url+'" alt="'+esc(name)+'">':'<p style="font-size:18px">'+esc(opts.label||('الملف جاهز: '+name))+'</p>';
  var first=gallery?'اضغط على أي صورة لتحميلها وحدها، أو اضغط عليها مطوّلاً ثم «حفظ الصورة».':
    shareable?'الأسهل: اضغط «حفظ في الصور» ثم اختر '+(isVid?'«حفظ الفيديو»':'«حفظ الصورة»')+'.':
    isImg?'اضغط مطوّلاً على الصورة ثم اختر «حفظ الصورة» أو «تنزيل الصورة».':'';
  ov.innerHTML=media+(first?'<p>'+first+'</p>':'')+'<p style="opacity:.8;font-size:14px">'+whereTip(isVid)+'</p>'+
    (IN_APP?'<p style="opacity:.85;font-size:14px">إن لم يعمل الحفظ داخل هذا التطبيق: '+hint()+'</p>':'')+
    '<div class="ays-row">'+(shareable?'<button type="button" class="ays-p" data-ays="share">حفظ في الصور / مشاركة</button>':'')+
    '<a'+(shareable?'':' class="ays-p"')+' href="'+url+'" download="'+esc(name)+'">'+(gallery?'تحميل الكل (ZIP)':'تحميل')+'</a>'+(IN_APP?browserActions():'')+
    '<button type="button" data-ays="x">إغلاق</button></div>';
  ov.addEventListener('click',function(e){
    var b=e.target.closest('[data-ays]'),k=b&&b.getAttribute('data-ays');
    if(k==='copy'){copyLink(b);return}
    // ضغطة جديدة من المستخدم، فلا تُرفض المشاركة لانتهاء مهلة التفاعل
    if(k==='share'){navigator.share({files:files}).catch(function(){});return}
    if(k==='x'||e.target===ov){ov.remove();setTimeout(function(){urls.forEach(function(u){URL.revokeObjectURL(u)})},1000)}
  });
  document.body.appendChild(ov);
  return 'preview';
}

/* إشعار بعد التحميل على الكمبيوتر يوضّح مكان الملف */
function toast(name){
  var old=document.querySelector('.ays-toast');if(old)old.remove();
  var t=document.createElement('div');t.className='ays-toast';t.setAttribute('role','status');
  t.innerHTML='<b>✓ تم التحميل:</b> '+esc(name)+'<br><span>'+whereTip(false).replace('بعد «تحميل» ','')+'</span><button type="button" aria-label="إغلاق">✕</button>';
  t.querySelector('button').onclick=function(){t.remove()};
  document.body.appendChild(t);
  setTimeout(function(){if(t.parentNode)t.remove()},9000);
}

function share(files){
  return navigator.share({files:files}).then(function(){return 'shared'},function(err){
    return err&&err.name==='AbortError'?'cancelled':null;
  });
}

/**
 * يحفظ ملفاً واحداً. على الجوال: نافذة المشاركة أولاً (حفظ مباشر في الصور)، وإن أُغلقت أو لم تتوفر
 * تظهر نافذة الحفظ بدل تنزيل صامت لا يجده المستخدم. على الكمبيوتر: تحميل عادي مع إشعار بمكان الملف.
 */
function save(blob,name){
  var f=toFile(blob,name),files=f?[f]:null;
  var p=(MOBILE&&canShareFiles(files))?share(files):Promise.resolve(null);
  return p.then(function(r){
    if(r==='shared')return r;
    if(MOBILE||IN_APP)return overlay(blob,name,files);
    var url=URL.createObjectURL(blob);
    anchor(url,name);
    // لا نلغي الرابط مبكراً: بعض المتصفحات تبدأ التحميل بعد تأكيد المستخدم
    setTimeout(function(){URL.revokeObjectURL(url)},120000);
    toast(name);
    return 'downloaded';
  });
}
/** عدة صور: على الجوال مشاركة دفعة واحدة أو معرض صور قابل للحفظ؛ على الكمبيوتر ملف ZIP. */
function saveMany(items,fallback,fallbackName){
  var files=[];
  items.forEach(function(it){var f=toFile(it.blob,it.name);if(f)files.push(f)});
  var all=files.length===items.length?files:null;
  if(MOBILE||IN_APP){
    var p=canShareFiles(all)?share(all):Promise.resolve(null);
    return p.then(function(r){
      if(r==='shared')return r;
      // ملف ZIP لا يظهر في المعرض، لذلك نعرض الصور نفسها
      return overlay(fallback(),fallbackName,all,{gallery:items,label:'تم تجهيز '+items.length+' صورة'});
    });
  }
  return save(fallback(),fallbackName);
}
window.AyaSave={save:save,saveMany:saveMany,inApp:IN_APP,ios:IOS,mobile:MOBILE,canShareFiles:canShareFiles};
})();
