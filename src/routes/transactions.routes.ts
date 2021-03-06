import { Router } from 'express';
import multer from 'multer'

import {getCustomRepository, getRepository, TransactionRepository} from 'typeorm'

import Category from '../models/Category'

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import uploadConfig from '../config/upload'

const upload = multer(uploadConfig)

interface Transactions{
  id: string,
  title: string,
  value: number,
  type: 'income' | 'outcome',
  category: Category | null,
  created_at: Date, 
  updated_at: Date
}


const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository)
  
  const transactions = await transactionsRepository.find()
  const balance = await transactionsRepository.getBalance()
  
  return response.json({transactions, balance})
});

transactionsRouter.post('/', async (request, response) => {
  const {title, value, type, category} = request.body
  const createTransactionService = new CreateTransactionService()

  const newTransaction = await createTransactionService.execute({title, value, type, category})

  return response.json(newTransaction)
});

transactionsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id
  
  const deleteTransactionService = new DeleteTransactionService()

  await deleteTransactionService.execute(id)

  return response.json({ok:true})
});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const importTransactions = new ImportTransactionsService()

  const transactions = await importTransactions.execute(request.file.path)

  return response.json(transactions)
});

export default transactionsRouter;
