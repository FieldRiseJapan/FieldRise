import { check } from './policy.mjs';
export const now=()=>Math.floor(Date.now()/1000);
export const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),v=>v.toString(16).padStart(2,'0')).join('');}
export async function crypt(value:string,keyHex:string,owner:string,decrypt=false){
 check(/^[a-f0-9]{64}$/.test(keyHex),'ENCRYPTION_NOT_CONFIGURED',503);
 const key=await crypto.subtle.importKey('raw',new Uint8Array(keyHex.match(/../g)!.map(x=>parseInt(x,16))), 'AES-GCM',false,['encrypt','decrypt']);
 const additionalData=new TextEncoder().encode(owner);
 if(decrypt){const raw=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12),additionalData},key,raw.slice(12)));}
 const iv=crypto.getRandomValues(new Uint8Array(12));const b=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData},key,new TextEncoder().encode(value)));return btoa(String.fromCharCode(...iv,...b));
}
