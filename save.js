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

/* نافذة احتياطية: معاينة للضغط المطوّل + حفظ في الصور + تحميل + فتح في المتصفح */
function overlay(blob,name,files,label){
  var url=URL.createObjectURL(blob);
  var isVid=/^video\//.test(blob.type),isImg=/^image\//.test(blob.type),many=files&&files.length>1;
  var shareable=canShareFiles(files);
  var ov=document.createElement('div');
  ov.className='ays-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  var media=isVid?'<video src="'+url+'" controls playsinline></video>':(isImg&&!many)?'<img src="'+url+'" alt="'+esc(name)+'">':'<p style="font-size:18px">'+esc(label||('الملف جاهز: '+name))+'</p>';
  var tip=shareable?'اضغط «حفظ في الصور» ثم اختر '+(isVid?'«حفظ الفيديو»':many?'«حفظ الصور»':'«حفظ الصورة»')+'.':
    isVid?(IOS?'شغّل الفيديو ثم اضغط زر المشاركة واختر «حفظ الفيديو».':'اضغط «تحميل»، أو ⋮ في مشغّل الفيديو ثم «تنزيل».'):
    (isImg&&!many)?'اضغط مطوّلاً على الصورة ثم اختر «حفظ الصورة» أو «تنزيل الصورة».':'اضغط «تحميل».';
  ov.innerHTML=media+'<p>'+tip+'</p>'+(IN_APP?'<p style="opacity:.85;font-size:14px">إن لم يعمل الحفظ داخل هذا التطبيق: '+hint()+'</p>':'')+
    '<div class="ays-row">'+(shareable?'<button type="button" class="ays-p" data-ays="share">حفظ في الصور / مشاركة</button>':'')+
    '<a'+(shareable?'':' class="ays-p"')+' href="'+url+'" download="'+esc(name)+'">تحميل</a>'+(IN_APP?browserActions():'')+
    '<button type="button" data-ays="x">إغلاق</button></div>';
  ov.addEventListener('click',function(e){
    var b=e.target.closest('[data-ays]'),k=b&&b.getAttribute('data-ays');
    if(k==='copy'){copyLink(b);return}
    // ضغطة جديدة من المستخدم، فلا تُرفض المشاركة لانتهاء مهلة التفاعل
    if(k==='share'){navigator.share({files:files}).catch(function(){});return}
    if(k==='x'||e.target===ov){ov.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)}
  });
  document.body.appendChild(ov);
  return 'preview';
}

function share(files){
  return navigator.share({files:files}).then(function(){return 'shared'},function(err){
    return err&&err.name==='AbortError'?'cancelled':null;
  });
}

/**
 * يحفظ ملفاً واحداً. على الجوال تُفتح نافذة المشاركة (تحفظ في الصور مباشرة)،
 * وعلى iPhone ومتصفحات التطبيقات تظهر نافذة معاينة إن لم تنجح المشاركة.
 * يعيد 'shared' | 'downloaded' | 'preview' | 'cancelled'.
 */
function save(blob,name){
  var f=toFile(blob,name),files=f?[f]:null;
  var p=(MOBILE&&canShareFiles(files))?share(files):Promise.resolve(null);
  return p.then(function(r){
    if(r)return r;
    if(IN_APP||IOS)return overlay(blob,name,files);
    var url=URL.createObjectURL(blob);
    anchor(url,name);
    // لا نلغي الرابط مبكراً: بعض المتصفحات تبدأ التحميل بعد تأكيد المستخدم
    setTimeout(function(){URL.revokeObjectURL(url)},120000);
    return 'downloaded';
  });
}
/** عدة ملفات: مشاركتها دفعة واحدة على الجوال، وإلا تحميل ملف بديل (ZIP). */
function saveMany(items,fallback,fallbackName){
  var files=[];
  items.forEach(function(it){var f=toFile(it.blob,it.name);if(f)files.push(f)});
  if(MOBILE&&files.length===items.length&&canShareFiles(files)){
    return share(files).then(function(r){
      if(r)return r;
      return overlay(fallback(),fallbackName,files,'تم تجهيز '+files.length+' صورة');
    });
  }
  return save(fallback(),fallbackName);
}
window.AyaSave={save:save,saveMany:saveMany,inApp:IN_APP,ios:IOS,mobile:MOBILE,canShareFiles:canShareFiles};
})();
