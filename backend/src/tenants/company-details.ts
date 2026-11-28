import {z} from 'zod'

const optionalText=(max:number)=>z.string().trim().min(1).max(max).optional()
export const companyDetailsInput=z.object({
 legalName:optionalText(160),
 address:optionalText(500),
 city:optionalText(120),
 state:optionalText(120),
 postalCode:optionalText(24),
 country:optionalText(100),
 phone:optionalText(40),
 website:z.url({protocol:/^https?$/}).max(500).optional(),
 registrationNumber:optionalText(100),
}).strict()

export type CompanyDetails=z.infer<typeof companyDetailsInput>
