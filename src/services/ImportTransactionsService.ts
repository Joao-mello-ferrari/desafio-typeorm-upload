import csvParse from 'csv-parse'

import {getCustomRepository, getRepository, In} from 'typeorm'
import Transaction from '../models/Transaction';

import fs from 'fs'
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository'

interface CsvTransaction{
  title: string,
  type: 'income' | 'outcome',
  value: number,
  category: string
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category)
    const transactionsRepository = getCustomRepository(TransactionsRepository)

    const contactsReadStream = fs.createReadStream(filePath)

    const parsers = csvParse({
      from_line: 2
    })

    const parseCsv = contactsReadStream.pipe(parsers)

    const transactions:CsvTransaction[] = []
    const categories:string[] = []

    parseCsv.on('data', async line=>{
      const [title, type, value, category] = line.map((cell:string)=>
        cell.trim()
      )

      if(!title || !type || !value) return

      categories.push(category)

      transactions.push({title, type, value, category})
    })

    await new Promise(resolve=> parseCsv.on('end', resolve))

    const existentCategories = await categoriesRepository.find({
      where:{
        title: In(categories)
      }
    })

    const existentCategoriesTitles = existentCategories.map((category)=>{
      return category.title
    })

    const newCategories = categories.filter((category)=>{
      return !existentCategoriesTitles.includes(category)
    }).filter((value, index, self)=>{
      return self.indexOf(value) === index
    })

    const addedCategories = categoriesRepository.create(
      newCategories.map((title)=>{
        return {title}
      })
    )

    await categoriesRepository.save(addedCategories)

    const allCategoriesInDatabase = [...existentCategories, ...addedCategories]

    const newTransactions = transactionsRepository.create(
      transactions.map(({title, type, value, category})=>{
        return{
          title,
          type,
          value,
          category: allCategoriesInDatabase.find((category1)=>{
            return category1.title === category
          })
        }
      })
    )

    await transactionsRepository.save(newTransactions)
  
    await fs.promises.unlink(filePath)

    return newTransactions
  }
}

export default ImportTransactionsService;
