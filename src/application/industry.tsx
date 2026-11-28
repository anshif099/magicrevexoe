import {useState} from 'react'
import {categoryFor} from '../../backend/src/business/industry-directory'
import {Field} from './ui'
import type {Channel} from './types'

export function IndustryFields({channels,merchant}:{channels:Channel[];merchant:boolean}){
 const [categoryCode,setCategoryCode]=useState('')
 const [subcategoryCode,setSubcategoryCode]=useState('')
 const available=channels.filter(channel=>merchant||categoryFor(channel.code))
 const category=categoryFor(categoryCode)
 const types=Object.entries(category?.subcategories[subcategoryCode]?.businessTypes??{})
 if(!merchant&&!available.length)return null
 return <>
  <Field label={merchant?'Industry channel':'Industry category'} name="industryChannelCode">
   <select name="industryChannelCode" required value={categoryCode} onChange={event=>{
    setCategoryCode(event.target.value)
    setSubcategoryCode('')
   }}>
    <option value="">Choose an industry</option>
    {available.map(channel=><option key={channel.id} value={channel.code}>{channel.name}</option>)}
   </select>
  </Field>
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
