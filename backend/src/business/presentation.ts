import {crc32} from 'node:zlib'
import {z} from 'zod'
import type {PoolConnection} from 'mysql2/promise'
import type {Principal} from '../auth/authorization.js'
import {select} from '../auth/database.js'
import type {TenantService,TenantActor} from '../tenants/service.js'
import {HttpError} from '../middleware/error-handler.js'

const keyword=z.string().trim().min(2).max(80).regex(/^[\p{L}\p{M}\p{N} '&(),.-]+$/u)
export const presentationInput=z.object({lockVersion:z.number().int().min(0).max(4294967294),seedKeywords:z.array(keyword).refine(v=>v.length===0||(v.length>=3&&v.length<=5)).refine(v=>new Set(v.map(k=>k.toLowerCase())).size===v.length)}).strict()
export const logoSizeLimit=1_000_000
export function validateLogo(raw:unknown):Buffer{
 if(!Buffer.isBuffer(raw)||raw.length>=logoSizeLimit||!raw.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))){
  throw new HttpError(400,'Choose a PNG smaller than 1 MB')
 }
 let hasImageData=false
 for(let offset=8;offset+12<=raw.length;){
  const length=raw.readUInt32BE(offset),end=offset+12+length
  if(end>raw.length||crc32(raw.subarray(offset+4,end-4))!==raw.readUInt32BE(end-4))break
  const kind=raw.toString('latin1',offset+4,offset+8)
  if(offset===8&&(kind!=='IHDR'||length!==13||!raw.readUInt32BE(offset+8)||!raw.readUInt32BE(offset+12)))break
  if(offset!==8&&kind==='IHDR')break
  if(kind==='IDAT'&&length>0)hasImageData=true
  if(kind==='IEND'){
   if(length===0&&hasImageData&&end===raw.length)return raw
   break
  }
  offset=end
 }
 throw new HttpError(400,'The PNG is incomplete or corrupted')
}
export class PresentationService{
 constructor(private readonly tenants:TenantService){}
 private async owner(db:PoolConnection,actor:TenantActor,id:string,write=false){const merchant=await this.tenants.authorizedAccount(db,actor,id,write?'tenant.manage':'tenant.read');if(merchant.kind!=='merchant'||!Number(merchant.effective))throw new HttpError(404,'Active merchant not found');return merchant}
 async get(principal:Principal,id:string){return this.tenants.withActor(principal,async(db,actor)=>{await this.owner(db,actor,id);const row=(await select(db,'SELECT seed_keywords,logo_png,lock_version FROM merchant_presentation WHERE tenant_id=?',[id]))[0];return{seedKeywords:row?(typeof row.seed_keywords==='string'?JSON.parse(row.seed_keywords):row.seed_keywords):[],logoDataUrl:row?.logo_png?'data:image/png;base64,'+row.logo_png.toString('base64'):null,lockVersion:row?.lock_version??0}},true)}
 async update(principal:Principal,id:string,raw:unknown){const parsed=presentationInput.safeParse(raw);if(!parsed.success)throw new HttpError(400,'Provide three to five distinct business keywords or an explicit empty list');return this.tenants.withActor(principal,async(db,actor)=>{
  await this.owner(db,actor,id,true);const row=(await select(db,'SELECT lock_version FROM merchant_presentation WHERE tenant_id=? FOR UPDATE',[id]))[0]
  if((row?.lock_version??0)!==parsed.data.lockVersion)throw new HttpError(409,'Presentation changed; reload before saving')
  if(row)await db.execute('UPDATE merchant_presentation SET seed_keywords=?,lock_version=lock_version+1 WHERE tenant_id=?',[JSON.stringify(parsed.data.seedKeywords),id]);else await db.execute('INSERT INTO merchant_presentation(tenant_id,seed_keywords) VALUES (?,?)',[id,JSON.stringify(parsed.data.seedKeywords)])
  await this.tenants.auditChange(db,actor,id,'merchant.presentation_updated',{},'merchant',id);return{saved:true,lockVersion:parsed.data.lockVersion+1}
 })}
 async logo(principal:Principal,id:string,raw:unknown,version:number){const png=validateLogo(raw);return this.tenants.withActor(principal,async(db,actor)=>{
  await this.owner(db,actor,id,true);const row=(await select(db,'SELECT lock_version FROM merchant_presentation WHERE tenant_id=? FOR UPDATE',[id]))[0]
  if((row?.lock_version??0)!==version)throw new HttpError(409,'Presentation changed; reload before saving')
  if(row)await db.execute('UPDATE merchant_presentation SET logo_png=?,lock_version=lock_version+1 WHERE tenant_id=?',[png,id]);else await db.execute("INSERT INTO merchant_presentation(tenant_id,seed_keywords,logo_png) VALUES (?,'[]',?)",[id,png])
  await this.tenants.auditChange(db,actor,id,'merchant.logo_updated',{},'merchant',id);return{saved:true,lockVersion:version+1}
 })}
}
