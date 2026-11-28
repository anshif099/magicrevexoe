import {render,screen,within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect,it} from 'vitest'
import {IndustryFields} from '../../src/application/industry'

it('lists the directory before seeding and clears dependent selections when the category changes',async()=>{
 const user=userEvent.setup()
 render(<IndustryFields merchant channels={[{id:'1',code:'salon_spa',name:'Salon & Spa',status:'active'}]}/>)
 const industry=screen.getByLabelText('Industry channel')
 expect(within(industry).getAllByRole('option')).toHaveLength(37)
 const subcategory=screen.getByLabelText('Subcategory')
 expect(subcategory).toBeDisabled()
 await user.selectOptions(industry,'industry_04')
 await user.selectOptions(subcategory,'dental')
 expect(within(screen.getByLabelText('Business type')).getByRole('option',{name:'orthodontics'})).toBeInTheDocument()
 expect(screen.getByRole('status')).toHaveTextContent('previewed')
 await user.selectOptions(industry,'industry_01')
 expect(subcategory).toHaveValue('')
 expect(within(subcategory).queryByRole('option',{name:'Dental'})).not.toBeInTheDocument()
 expect(within(subcategory).getByRole('option',{name:'Restaurants'})).toBeInTheDocument()
 expect(screen.queryByLabelText('Business type')).not.toBeInTheDocument()
})
