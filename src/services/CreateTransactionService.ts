import AppError from '../errors/AppError';
import {getCustomRepository, getRepository} from 'typeorm'

import TransactionsRepository from '../repositories/TransactionsRepository'
import Transaction from '../models/Transaction';
import Category from '../models/Category'

interface Request{
  title: string,
  value: number, 
  type: 'income' | 'outcome', 
  category: string

}

class CreateTransactionService {
  public async execute({title, value, type, category}: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository)
    const categoriesRepository = getRepository(Category)

    const {total} = await transactionsRepository.getBalance()

    if(type === "outcome"){
      if(total-value < 0){
        throw new AppError("Not enough balance to withdrawal",400)
      }
    }

    let isCategoryAlreadyCreated = await categoriesRepository.findOne({
      where:{title:category}
    })

    
    if(!isCategoryAlreadyCreated){
      const categoryToBeCreated = await categoriesRepository.create({title:category})
      await categoriesRepository.save(categoryToBeCreated)
      
      isCategoryAlreadyCreated = categoryToBeCreated
    }
    
    const newTrasaction = await transactionsRepository.create({
      title,
      type,
      value,
      category_id: isCategoryAlreadyCreated.id
    })

    await transactionsRepository.save(newTrasaction)
    
    return newTrasaction
  }
}

export default CreateTransactionService;
