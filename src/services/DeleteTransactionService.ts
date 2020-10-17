import {getCustomRepository, ObjectID} from 'typeorm'

import TransactionsRepository from '../repositories/TransactionsRepository'
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id:string) {
    const transactionsRepository = getCustomRepository(TransactionsRepository)
    
    const transactionToDelete = await transactionsRepository.findOne(id)

    if(!transactionToDelete){
      throw new AppError("Can´t delete an unexisting transaction")
    }

    await transactionsRepository.remove(transactionToDelete)
  }
}

export default DeleteTransactionService;
