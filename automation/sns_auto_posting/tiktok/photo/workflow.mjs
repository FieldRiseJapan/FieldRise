import {safeUrl} from './core.mjs';
export const categories=['ファッション紹介','日常・ライフスタイル','カフェ・リラックス','旅行・風景','インテリア','その他'];
export const statuses=['下書き','準備完了','投稿予定','投稿済み','保留','取消'];
const clean=(v,max=500)=>{if(v==null)return '';if(typeof v!=='string'||v.length>max||/(?:-----BEGIN .*PRIVATE KEY|eyJ[A-Za-z0-9_-]{20,}\.|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{24,})/.test(v))throw Error('入力の形式・長さを確認してください');return v.trim();};
function datetime(v){const s=clean(v,100);if(!s)return '';if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(s)||!Number.isFinite(Date.parse(s)))throw Error('日時はタイムゾーン付きで保存してください');const parts=s.slice(0,10).split('-').map(Number),days=new Date(Date.UTC(parts[0],parts[1],0)).getUTCDate();if(parts[1]<1||parts[1]>12||parts[2]<1||parts[2]>days||Number(s.slice(11,13))>23||Number(s.slice(14,16))>59)throw Error('存在する日付・時刻を指定してください');return new Date(s).toISOString();}
export function localDate(v){if(!v)return '';if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v))throw Error('日時を入力してください');return datetime(v+'+09:00');}
export function japanDate(v){return v?new Date(Date.parse(v)+9*3600000).toISOString().slice(0,16):'';}
export function workflow(v){const category=clean(v.category||'その他',40),captionLength=v.captionLength||'標準',status=v.status||(v.ready?'準備完了':'下書き');if(!categories.includes(category)||!['短め','標準','長め'].includes(captionLength)||!statuses.includes(status))throw Error('カテゴリ・長さ・状態が不正です');const scheduledAt=datetime(v.scheduledAt),publishedAt=datetime(v.publishedAt),publishedUrl=safeUrl(clean(v.publishedUrl,1000));if(publishedUrl&&!['tiktok.com','www.tiktok.com'].includes(new URL(publishedUrl).hostname))throw Error('投稿URLはTikTokのHTTPS URLにしてください');if(Boolean(publishedAt)!==Boolean(publishedUrl)||status==='投稿済み'&&!publishedUrl)throw Error('投稿済みURLと日時を両方入力してください');if(status==='投稿予定'&&!scheduledAt)throw Error('投稿予定日時が必要です');if(['準備完了','投稿予定'].includes(status)&&(!v.ready||v.music?.businessUse==='利用不可（本人確認）'||v.music?.match!=='確認済み'||!v.distributionChecked||!v.finalSoundChecked))throw Error('音源確認・素材の準備が完了していません');const history=v.statusHistory||[];if(!Array.isArray(history)||history.length>1000)throw Error('状態履歴が不正です');const statusHistory=history.map(h=>{if(!h||!statuses.includes(h.from)&&h.from!==''||!statuses.includes(h.to))throw Error('状態履歴が不正です');const at=datetime(h.at);if(!at)throw Error('履歴日時が必要です');return {from:h.from,to:h.to,at,reason:clean(h.reason,500)};});const language=v.language??'ja',captionStyle=v.captionStyle??'Natural';if(!['en','ja'].includes(language)||!['Natural','Emotional','Minimal'].includes(captionStyle))throw Error('投稿言語・スタイルが不正です');return {language,captionStyle,brandTags:v.brandTags===true,mentionMusic:v.mentionMusic===true,context:clean(v.context,500),purpose:clean(v.purpose,120),mood:clean(v.mood,120),category,customCategory:clean(v.customCategory,120),captionLength,scheduledAt,publishedAt,publishedUrl,status,statusHistory};}
export function transition(v,changes,now=new Date().toISOString()){const next={...v,...changes};if(next.status!==v.status)next.statusHistory=[...(v.statusHistory||[]),{from:v.status||'下書き',to:next.status,at:now,reason:changes.changeReason||''}];return {...next,...workflow(next)};}
export function duplicate(v,now=new Date().toISOString()){return {...v,...(v.studioSound?{studioSound:{...v.studioSound,state:'未確認',ownerCompared:false,draftRetained:false,verifiedAt:'',draftVerifiedAt:'',reviewer:''}}:{}),id:crypto.randomUUID(),name:(v.name+'（複製）').slice(0,120),createdAt:now,updatedAt:now,photos:v.photos.map(p=>({...p,id:crypto.randomUUID()})),music:v.music?{...v.music}:null,ready:false,finalSoundChecked:false,distributionChecked:false,override:'',status:'下書き',scheduledAt:'',publishedAt:'',publishedUrl:'',statusHistory:[{from:'',to:'下書き',at:now,reason:'複製：最終確認は再実施'}]};}
export function findSets(rows,{query='',status='',sort='asc'}={}){const q=query.toLocaleLowerCase();return rows.filter(s=>(!status||s.status===status)&&[s.name,s.music?.title,s.category,s.customCategory].join(' ').toLocaleLowerCase().includes(q)).sort((a,b)=>{const x=a.scheduledAt||a.updatedAt,y=b.scheduledAt||b.updatedAt;return sort==='desc'?y.localeCompare(x):x.localeCompare(y);});}
export function conflicts(rows,v){return v.scheduledAt&&v.status==='投稿予定'?rows.filter(s=>s.id!==v.id&&s.status==='投稿予定'&&s.scheduledAt===v.scheduledAt):[];}
function japaneseCaptions(category,context,purpose,song,length='標準',custom='',mood=''){
 if(!categories.includes(category)||!['短め','標準','長め'].includes(length))throw Error('投稿カテゴリ・長さが不正です');
 const theme=category==='その他'?(clean(custom,120)||'写真'):category,c=clean(context,500).replace(/[。.!！]+$/u,''),m=clean(mood,120);
 const templates={
 'ファッション紹介':['今日のコーデを写真にまとめました。','色や小物の組み合わせを楽しむ日。','お気に入りのスタイルを記録。'],
 '日常・ライフスタイル':['何気ない日常のひとこま。','暮らしの中で見つけた、小さな楽しみ。','今日を振り返る写真の記録。'],
 'カフェ・リラックス':['ひと息つく、カフェ時間。','コーヒーと一緒に、ゆっくり過ごす午後。','肩の力を抜いて、くつろぐひととき。'],
 '旅行・風景':['旅先で出会った景色を記録。','足を止めて眺めたくなる風景。','写真で振り返る、今日の景色。'],
 'インテリア':['お気に入りの空間を少しだけ。','部屋の小さな工夫を写真に。','暮らしに馴染む、好きなもの。'],
 'その他':[theme+'の記録。','写真に残しておきたいひとこま。','今日の一枚を、音楽と一緒に。']};
 const tags={'ファッション紹介':['ファッション','コーデ'],'日常・ライフスタイル':['日常','暮らし'],'カフェ・リラックス':['カフェ','くつろぎ'],'旅行・風景':['旅行','風景'],'インテリア':['インテリア','部屋づくり'],'その他':['写真記録']}[category];
 return templates[category].map(phrase=>({title:(c||phrase.replace(/。$/,'')).slice(0,90),description:((c?c+'。':'')+phrase+(length==='短め'?'':(m?' '+m+'の雰囲気に合わせて。':'')+` 音楽は「${song.title}」 / ${song.artist}。`)+(length==='長め'?(purpose==='楽曲を紹介'?' 写真と一緒に、曲の雰囲気も楽しんでください。':' 気になった一枚をゆっくり眺めてみてください。'):'')).slice(0,1500),tags:[...new Set(tags)].map(t=>'#'+t).join(' ')}));
}
export function setsCsv(rows){const keys=['id','name','photoCount','language','captionStyle','category','customCategory','status','scheduledAt','publishedAt','publishedUrl','updatedAt','song','match','businessUse','override','title','description','hashtags'];const cell=v=>{let s=String(v??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\ufeff'+[keys,...rows.map(s=>keys.map(k=>k==='song'?s.music?.title:k==='match'?s.music?.match:k==='businessUse'?s.music?.businessUse:s[k]))].map(r=>r.map(cell).join(',')).join('\r\n');}

export function englishTags(category,context='',mood='',purpose='',song={},brand=false){
 const base={'ファッション紹介':['Fashion','DailyStyle'],'日常・ライフスタイル':['Lifestyle','EverydayMoments'],'カフェ・リラックス':['Cafe','CoffeeTime'],'旅行・風景':['Travel','Scenery'],'インテリア':['Interior','HomeDetails'],'その他':['PhotoDiary']}[category];if(!base)throw Error('投稿カテゴリが不正です');
 const text=clean(context,500).toLocaleLowerCase(),feel=clean(mood,120).toLocaleLowerCase();const tags=[...base];
 for(const [pattern,tag] of [[/\bcoffee\b|コーヒー/,'Coffee'],[/\bbeach\b|海辺/,'Beach'],[/\bforest\b|森/,'Nature'],[/\bplant(?:s)?\b|観葉植物/,'Plants'],[/\boutfit\b|コーデ/,'Outfit']])if(pattern.test(text))tags.push(tag);
 if(/calm|relax|穏やか|ゆったり/.test(feel))tags.push('RelaxingMusic');else if(/jazz|ジャズ/.test(feel))tags.push('JazzVibes');
 if(purpose==='楽曲を紹介')tags.push('Music');
 if(brand){tags.splice(4);tags.push('FieldRise');const artist=String(song.artist||'').replace(/[^A-Za-z0-9_]/g,'');if(artist)tags.push(artist.slice(0,60));}
 const seen=new Set();return tags.filter(t=>{const raw=t.toLocaleLowerCase(),key=({coffee:'coffee',coffeetime:'coffee',outfit:'style',dailystyle:'style'})[raw]||raw;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,6).map(t=>'#'+t).join(' ');
}
export function captions(category,context,purpose,song,length='標準',custom='',mood='',options={}){
 const language=options.language||'ja';if(!['en','ja'].includes(language))throw Error('投稿言語が不正です');
 const styles=['Natural','Emotional','Minimal'];
 if(language==='ja')return japaneseCaptions(category,context,purpose,song,length,custom,mood).map((out,i)=>({...out,style:styles[i]}));
 if(!categories.includes(category)||!['短め','標準','長め'].includes(length))throw Error('投稿カテゴリ・長さが不正です');
 const bank={
 'ファッション紹介':[['A few details from today’s outfit.','Today’s look, one detail at a time.'],['Wearing what feels like me.','A little confidence in the everyday.'],['Everyday style.','Less fuss, more style.']],
 '日常・ライフスタイル':[['A few moments from an ordinary day.','A little glimpse of everyday life.'],['The small things make a day feel special.','Finding a little joy in the everyday.'],['Slow moments.','A day in details.']],
 'カフェ・リラックス':[['Taking a little coffee break.','A few moments from today’s cafe stop.'],['A warm cup and a moment to breathe.','Some days call for a slower pace.'],['Coffee. A quiet moment.','Sip. Pause. Repeat.']],
 '旅行・風景':[['A few views from along the way.','Scenes from a day out exploring.'],['A place I’ll want to remember.','Some views invite you to stay a little longer.'],['Views worth a pause.','Out here, taking it in.']],
 'インテリア':[['A closer look at a favorite corner.','A few details from around the room.'],['Small details that make a place feel like home.','Making room for what feels good.'],['A corner of home.','Simple space. Small details.']],
 'その他':[['A few moments I wanted to keep.','A little photo diary.'],['Some moments are worth a second look.','A small moment with something to remember.'],['Just this moment.','A little glimpse.']]};
 const hasJapanese=s=>/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(s);
 const input=clean(context,500),free=clean(custom,120),feel=clean(mood,120);const c=hasJapanese(input)?'':input.replace(/[.!?]+$/,''),topic=hasJapanese(free)?'':free;
 const variant=Number.isSafeInteger(options.variant)?Math.abs(options.variant)%2:0;
 const moodText=/calm|relax|穏やか|ゆったり/i.test(feel)?'Keeping the mood calm.':/jazz|ジャズ/i.test(feel)?'A little jazz in the background.':feel&&!hasJapanese(feel)?'Mood: '+feel.replace(/[.!?]+$/,'')+'.':'';
 return styles.map((style,i)=>{const phrase=bank[category][i][variant],prefix=length==='短め'?'':c&&c.toLocaleLowerCase()!==phrase.replace(/[.!?]+$/,'').toLocaleLowerCase()?c+'. ':!c&&category==='その他'&&topic?topic+'. ':'';
 const music=options.mentionMusic||purpose==='楽曲を紹介'?` Soundtrack: “${song.title}” by ${song.artist}.`:'';
 return {style,title:(c||phrase.replace(/\.$/,'')).slice(0,90),description:(prefix+phrase+(length==='短め'?'':music)+(length==='長め'&&moodText?' '+moodText:'')).slice(0,1500),tags:englishTags(category,input,feel,purpose,song,options.brandTags===true)};});
}
