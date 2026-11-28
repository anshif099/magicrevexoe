import {useState} from 'react'
import {categoryFor,industryDirectory} from '../../backend/src/business/industry-directory'
import {Field,Notice} from './ui'
import type {Channel} from './types'

export function IndustryFields({channels,merchant}:{channels:Channel[];merchant:boolean}){
 const [categoryCode,setCategoryCode]=useState('')
 const [subcategoryCode,setSubcategoryCode]=useState('')
 const active=new Map(channels.filter(channel=>channel.status==='active').map(channel=>[channel.code,channel]))
 const legacy=merchant?[...active.values()].filter(channel=>!categoryFor(channel.code)):[]
 const directory=Object.entries(industryDirectory)
 const hasActiveDirectory=directory.some(([code])=>active.has(code))
 const pending=!!categoryCode&&!active.has(categoryCode)
 const category=categoryFor(categoryCode)
 const types=Object.entries(category?.subcategories[subcategoryCode]?.businessTypes??{})
 return <>
  <Field label={merchant?'Industry channel':'Industry category'} name="industryChannelCode">
   <select name="industryChannelCode" required={merchant||hasActiveDirectory} value={categoryCode} onChange={event=>{
    setCategoryCode(event.target.value)
    setSubcategoryCode('')
   }}>
    <option value="">Choose an industry</option>
    {directory.map(([code,entry])=><option key={code} value={code}>{active.get(code)?.name??entry.name}{!active.has(code)&&' (preview)'}</option>)}
    {legacy.map(channel=><option key={channel.id} value={channel.code}>{channel.name}</option>)}
   </select>
  </Field>
  {pending&&<Notice>This category can be previewed here. Select an active industry to create the account.</Notice>}
  <Field label="Subcategory" name="subcategoryCode">
   <select name="subcategoryCode" disabled={!category} required={!!category} value={subcategoryCode} onChange={event=>setSubcategoryCode(event.target.value)}>
    <option value="">Choose a subcategory</option>
    {Object.entries(category?.subcategories??{}).map(([code,sub])=><option key={code} value={code}>{sub.name}</option>)}
   </select>
  </Field>
  {!!types.length&&<Field label="Business type" name="businessTypeCode">
   <select name="businessTypeCode" required key={categoryCode+'/'+subcategoryCode} defaultValue="">
    <option value="">Choose a business type</option>
    {types.map(([code,name])=><option key={code} value={code}>{name}</option>)}
   </select>
  </Field>}
 </>
}

export function IndustrySubcategories({code}:{code:string}){
 const category=categoryFor(code)
 if(!category)return null
 return <details><summary>Subcategories</summary>
  <ul>{Object.entries(category.subcategories).map(([id,sub])=>{
   const types=Object.values(sub.businessTypes)
   return <li key={id}>{sub.name}{types.length>0&&<ul>{types.map(type=><li key={type}>{type}</li>)}</ul>}</li>
  })}</ul>
 </details>
}
