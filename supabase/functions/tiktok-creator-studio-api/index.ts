import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGIN="https://fieldrisejapan.github.io";
const BASE_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
function headers(origin:string|null){return {...BASE_HEADERS,"access-control-allow-origin":origin===ALLOWED_ORIGIN?ALLOWED_ORIGIN:"null","access-control-allow-headers":"content-type,x-fieldrise-session","access-control-allow-methods":"GET,POST,OPTIONS","vary":"Origin"};}
function json(data:any,status=200,origin:string|null=null){return new Response(JSON.stringify(data),{status,headers:headers(origin)});}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("");}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:headers(origin)});
  if(origin!==ALLOWED_ORIGIN) return json({ok:false,error:"origin_not_allowed"},403,origin);

  const surl=Deno.env.get("SUPABASE_URL"),role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),clientKey=Deno.env.get("TIKTOK_CLIENT_KEY"),clientSecret=Deno.env.get("TIKTOK_CLIENT_SECRET");
  if(!surl||!role||!clientKey||!clientSecret) return json({ok:false,error:"server_not_configured"},500,origin);
  const sb=createClient(surl,role);

  const rawSession=req.headers.get("x-fieldrise-session")||"";
  if(!rawSession) return json({ok:false,error:"missing_session"},401,origin);
  const sessionHash=await sha256(rawSession);
  const {data:session}=await sb.from("tiktok_creator_studio_sessions").select("open_id,expires_at").eq("session_hash",sessionHash).maybeSingle();
  if(!session||new Date(session.expires_at).getTime()<=Date.now()) return json({ok:false,error:"session_expired"},401,origin);
  await sb.from("tiktok_creator_studio_sessions").update({last_used_at:new Date().toISOString()}).eq("session_hash",sessionHash);

  async function validToken(){
    const {data:t,error:e}=await sb.from("tiktok_oauth_tokens").select("open_id,access_token,refresh_token,expires_at,refresh_expires_at,scope").eq("open_id",session.open_id).maybeSingle();
    if(e||!t?.access_token) throw new Error("token_not_found");
    if(t.expires_at && new Date(t.expires_at).getTime()-Date.now()>5*60*1000) return t.access_token as string;
    if(!t.refresh_token) throw new Error("refresh_token_not_found");
    const body=new URLSearchParams({client_key:clientKey!,client_secret:clientSecret!,grant_type:"refresh_token",refresh_token:t.refresh_token});
    const rr=await fetch("https://open.tiktokapis.com/v2/oauth/token/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
    const p=await rr.json();
    if(!rr.ok||!p?.access_token||!p?.refresh_token) throw new Error(`token_refresh_failed:${p?.error_description||p?.error||rr.status}`);
    const now=Date.now();
    const expiresAt=new Date(now+Number(p.expires_in??86400)*1000).toISOString();
    const refreshExpiresAt=new Date(now+Number(p.refresh_expires_in??31536000)*1000).toISOString();
    const {error:ue}=await sb.from("tiktok_oauth_tokens").upsert({open_id:session.open_id,access_token:p.access_token,refresh_token:p.refresh_token,scope:p.scope??t.scope,token_type:p.token_type??"Bearer",expires_at:expiresAt,refresh_expires_at:refreshExpiresAt,updated_at:new Date(now).toISOString()},{onConflict:"open_id"});
    if(ue) throw ue;
    return p.access_token as string;
  }

  async function creatorInfo(token:string){
    const r=await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json; charset=UTF-8"}});
    const p=await r.json();
    if(!r.ok||p?.error?.code!=="ok") throw new Error(`creator_info_failed:${p?.error?.message||p?.error?.code||r.status}`);
    return p.data;
  }

  try{
    const url=new URL(req.url);
    const action=url.searchParams.get("action")||"creator";
    const token=await validToken();

    if(req.method==="GET"&&action==="creator"){
      const c=await creatorInfo(token);
      return json({ok:true,creator:{username:c.creator_username??null,nickname:c.creator_nickname??null,avatar_url:c.creator_avatar_url??null,privacy_level_options:c.privacy_level_options??[],comment_disabled:!!c.comment_disabled,duet_disabled:!!c.duet_disabled,stitch_disabled:!!c.stitch_disabled,max_video_post_duration_sec:c.max_video_post_duration_sec??null}},200,origin);
    }

    if(req.method==="POST"&&(action==="publish"||action==="upload")){
      const form=await req.formData();
      const file=form.get("video");
      if(!(file instanceof File)) return json({ok:false,error:"video_required"},400,origin);
      if(file.type!=="video/mp4") return json({ok:false,error:"mp4_required"},400,origin);
      if(file.size<=0||file.size>50*1024*1024) return json({ok:false,error:"video_size_invalid",max_mb:50},400,origin);
      const consent=String(form.get("consent")||"")==="true";
      if(!consent) return json({ok:false,error:"explicit_consent_required"},400,origin);

      const isDraft=action==="upload";
      const c=isDraft?null:await creatorInfo(token);
      const privacy=String(form.get("privacy_level")||"");
      if(!isDraft&&(!privacy||!(c!.privacy_level_options??[]).includes(privacy))) return json({ok:false,error:"invalid_privacy_level"},400,origin);
      const title=String(form.get("title")||"").slice(0,2200);
      const disableComment=c?.comment_disabled?true:String(form.get("disable_comment")||"")==="true";
      const disableDuet=c?.duet_disabled?true:String(form.get("disable_duet")||"")==="true";
      const disableStitch=c?.stitch_disabled?true:String(form.get("disable_stitch")||"")==="true";
      const brandContent=String(form.get("brand_content_toggle")||"")==="true";
      const brandOrganic=String(form.get("brand_organic_toggle")||"")==="true";
      const isAigc=String(form.get("is_aigc")||"")==="true";

      if(!isDraft&&brandContent&&privacy==="SELF_ONLY") return json({ok:false,error:"branded_content_cannot_be_private"},400,origin);
      const sourceInfo={source:"FILE_UPLOAD",video_size:file.size,chunk_size:file.size,total_chunk_count:1};
      const initBody=isDraft?{source_info:sourceInfo}:{post_info:{title,privacy_level:privacy,disable_duet:disableDuet,disable_comment:disableComment,disable_stitch:disableStitch,brand_content_toggle:brandContent,brand_organic_toggle:brandOrganic,is_aigc:isAigc},source_info:sourceInfo};
      const ir=await fetch(isDraft?"https://open.tiktokapis.com/v2/post/publish/inbox/video/init/":"https://open.tiktokapis.com/v2/post/publish/video/init/",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json; charset=UTF-8"},body:JSON.stringify(initBody)});
      const ip=await ir.json();
      if(!ir.ok||ip?.error?.code!=="ok"||!ip?.data?.upload_url||!ip?.data?.publish_id) return json({ok:false,error:"publish_init_failed",details:{code:ip?.error?.code??null,message:ip?.error?.message??null}},502,origin);

      const bytes=new Uint8Array(await file.arrayBuffer());
      const ur=await fetch(ip.data.upload_url,{method:"PUT",headers:{"Content-Type":"video/mp4","Content-Length":String(file.size),"Content-Range":`bytes 0-${file.size-1}/${file.size}`},body:bytes});
      if(!ur.ok) return json({ok:false,error:"upload_failed",status:ur.status},502,origin);

      await sb.from("tiktok_creator_studio_publish_jobs").upsert({publish_id:ip.data.publish_id,open_id:session.open_id},{onConflict:"publish_id"});
      return json({ok:true,publish_id:ip.data.publish_id,status:"PROCESSING_UPLOAD"},200,origin);
    }

    if(req.method==="POST"&&action==="status"){
      const body=await req.json().catch(()=>({}));
      const publishId=String(body?.publish_id||"");
      if(!publishId) return json({ok:false,error:"publish_id_required"},400,origin);
      const {data:job}=await sb.from("tiktok_creator_studio_publish_jobs").select("publish_id").eq("publish_id",publishId).eq("open_id",session.open_id).maybeSingle();
      if(!job) return json({ok:false,error:"publish_job_not_found"},404,origin);
      const sr=await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json; charset=UTF-8"},body:JSON.stringify({publish_id:publishId})});
      const sp=await sr.json();
      if(!sr.ok||sp?.error?.code!=="ok") return json({ok:false,error:"status_fetch_failed",details:{code:sp?.error?.code??null,message:sp?.error?.message??null}},502,origin);
      return json({ok:true,publish_id:publishId,status:sp?.data?.status??null,uploaded_bytes:sp?.data?.uploaded_bytes??null,fail_reason:sp?.data?.fail_reason??null,publicaly_available_post_id:sp?.data?.publicaly_available_post_id??null},200,origin);
    }

    return json({ok:false,error:"not_found"},404,origin);
  }catch(e){return json({ok:false,error:String(e)},500,origin);}
});

