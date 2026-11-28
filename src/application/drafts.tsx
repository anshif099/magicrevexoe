import {useState,type FormEvent} from 'react'
import {Notice} from './ui'
import {publicText,publicMessages,type Language} from './languages'

const tags=['friendly_team','clean_environment','short_wait','long_wait','helpful_service','service_could_improve'] as const
const templates={
 en:{
  rating:(value:number)=>`My overall rating is ${value} out of 5.`,
  sentences:['The team was friendly.','The place was clean.','The wait was short.','The wait was long.','The service was helpful.','The service could improve.'],
 },
 hi:{
  rating:(value:number)=>`मेरी कुल रेटिंग 5 में से ${value} है।`,
  sentences:['टीम का व्यवहार दोस्ताना था।','जगह साफ़ थी।','ज़्यादा इंतज़ार नहीं करना पड़ा।','काफ़ी देर इंतज़ार करना पड़ा।','सेवा मददगार थी।','सेवा में सुधार की गुंजाइश है।'],
 },
 ml:{
  rating:(value:number)=>`എന്റെ മൊത്തത്തിലുള്ള റേറ്റിംഗ് 5-ൽ ${value} ആണ്.`,
  sentences:['ജീവനക്കാർ സൗഹൃദപരമായിരുന്നു.','സ്ഥലം വൃത്തിയുള്ളതായിരുന്നു.','കാത്തിരിപ്പ് കുറവായിരുന്നു.','കാത്തിരിപ്പ് നീണ്ടുപോയി.','സേവനം സഹായകരമായിരുന്നു.','സേവനം മെച്ചപ്പെടുത്താൻ കഴിയും.'],
 },
}

export function DraftForm({language,googleUrl,presetRating}:{language:Language;googleUrl:string;presetRating?:number|undefined}){
 const text=publicText[language]
 const [draft,setDraft]=useState<string|null>(null)
 const [error,setError]=useState('')
 const [ownRating,setOwnRating]=useState<string|undefined>()
 function generate(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  const data=new FormData(event.currentTarget)
  const rating=Number(data.get('rating'))
  const selected=data.getAll('tags')
  if(selected.length>3){setError(publicMessages[language].maxTags);return}
  const template=templates[language]
  setDraft([template.rating(rating),...template.sentences.filter((_,index)=>selected.includes(tags[index]))].join(' '))
  setError('')
 }
 function copyAndOpen(){
  window.open(googleUrl,'_blank','noopener,noreferrer')
  if(navigator.clipboard)void navigator.clipboard.writeText(draft??'').catch(()=>setError(text.copyFailed))
  else setError(text.copyFailed)
 }
 return <details className="live-private-form">
  <summary>{text.ai}</summary>
  <p>{text.aiNote}</p>
  <form className="live-form" onSubmit={generate} hidden={draft!==null}>
   <label className="live-field">{text.rating}<select name="rating" required value={ownRating??String(presetRating??'')} onChange={event=>setOwnRating(event.target.value)}>
    <option value="">{text.choose}</option>
    {[1,2,3,4,5].map(rating=><option key={rating} value={rating}>{rating} {text.outOf}</option>)}
   </select></label>
   {tags.map(tag=><label key={tag} className="live-check"><input name="tags" value={tag} type="checkbox"/>{text[tag]}</label>)}
   <button className="live-button">{text.generate}</button>
  </form>
  {draft!==null&&<>
   <label className="live-field">{text.draft}<textarea value={draft} maxLength={4096} onChange={event=>setDraft(event.target.value)}/></label>
   <div className="live-row">
    <button className="live-button" disabled={!draft.trim()} onClick={copyAndOpen}>{text.copy}</button>
    <button className="live-quiet-button" onClick={()=>{setDraft(null);setError('')}}>{text.newForm}</button>
   </div>
  </>}
  {error&&<Notice error>{error}</Notice>}
 </details>
}
