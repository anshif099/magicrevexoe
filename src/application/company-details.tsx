import type {CompanyDetails} from './types'
import {Field,value} from './ui'

const fields=[
 {name:'legalName',label:'Legal company name',maxLength:160},
 {name:'registrationNumber',label:'Business registration ID (optional)',maxLength:100},
 {name:'address',label:'Business address',maxLength:500},
 {name:'city',label:'City',maxLength:120},
 {name:'state',label:'State or region',maxLength:120},
 {name:'postalCode',label:'Postal code',maxLength:24},
 {name:'country',label:'Country',maxLength:100},
 {name:'phone',label:'Business phone',type:'tel',maxLength:40},
 {name:'website',label:'Business website',type:'url',maxLength:500},
] as const

export function readCompanyDetails(data:FormData):CompanyDetails|undefined{
 const entries=fields.map(({name})=>[name,value(data,name)]).filter(([,answer])=>answer)
 return entries.length?Object.fromEntries(entries):undefined
}

export function CompanyDetailsFields({details}:{details?:CompanyDetails|null}){
 return <details>
  <summary>Company and location details</summary>
  <div className="live-form-grid">{fields.map(field=><Field key={field.name} {...field} defaultValue={details?.[field.name]}/>)}</div>
 </details>
}

export function CompanyDetailsView({details}:{details?:CompanyDetails|null}){
 const entries=fields.filter(field=>details?.[field.name])
 return <>
  <h3>Company and location details</h3>
  {entries.length?<><p className="live-muted">Submitted information for manual verification.</p>
   <dl className="live-description">{entries.map(({name,label})=><div key={name}><dt>{label}</dt><dd>{details?.[name]}</dd></div>)}</dl>
  </>:<p>No company details have been submitted.</p>}
 </>
}
