import {AppError} from './policy.mjs';
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');}
// Internal operator-only executor. No HTTP route, hosted binding or implicit deployment invocation.
export async function applyIsolatedMigration(db:D1Database,plan:{id:string;sql:string;checksum:string}){
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(plan.id)||await hash(plan.sql)!==plan.checksum)throw new AppError('MIGRATION_CHECKSUM',409);
 await db.prepare('CREATE TABLE IF NOT EXISTS _fieldrise_migration_history(id TEXT PRIMARY KEY,checksum TEXT NOT NULL)').run();
 const definitions=plan.sql.split('--> statement-breakpoint').map(s=>s.replace(/^--.*$/gm,'').trim()).filter(s=>/^CREATE (?:UNIQUE )?(?:TABLE|INDEX|TRIGGER)\s/i.test(s));
 const verify=async()=>{for(const statement of definitions){const m=statement.match(/^CREATE (?:UNIQUE )?(?:TABLE|INDEX|TRIGGER)\s+([^\s(]+)/i);const name=m![1].replace(/["`]/g,'');const row=await db.prepare('SELECT sql FROM sqlite_master WHERE name=?').bind(name).first<{sql:string}>();const normalize=(s:string)=>s.trim().replace(/;+$/,'').split(/('(?:''|[^'])*')/g).map((part,i)=>i%2?part:part.replace(/\s+/g,' ').toLowerCase()).join('');if(!row||normalize(row.sql)!==normalize(statement))throw new AppError('MIGRATION_SCHEMA_MISMATCH',409);}};
 const old=await db.prepare('SELECT checksum FROM _fieldrise_migration_history WHERE id=?').bind(plan.id).first<{checksum:string}>();if(old){if(old.checksum!==plan.checksum)throw new AppError('MIGRATION_HISTORY_MISMATCH',409);await verify();return {applied:false};}
 const statements=plan.sql.split('--> statement-breakpoint').filter(x=>x.trim());if(!statements.length||statements.length>40)throw new AppError('MIGRATION_BUDGET',409);
 // Each migration and its receipt are one D1 batch. No partial DDL is accepted or silently adopted.
 try{await db.batch(statements.map(sql=>db.prepare(sql)).concat([db.prepare('INSERT INTO _fieldrise_migration_history VALUES(?,?)').bind(plan.id,plan.checksum)]));await verify();return {applied:true};}catch{throw new AppError('MIGRATION_APPLY_FAILED',409)}
}
