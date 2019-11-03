import {Command, flags} from '@oclif/command'
import {dxOptions} from '../../helper/interfaces'
import {getRelativePath, prepJsonForCsv} from '../../helper/utility'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

function toCsv(items: any) {
  return csvjson.toCSV(items, {headers: 'relative'})
}

export default class Query extends Command {
  static description = 'Execute anonymous apex.'

  static examples = [
    `$ q dx:query`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u'}),
    file: flags.string({char: 'f', description: 'Relative path of query file in unix format.'}),
    query: flags.string({char: 'q', description: 'SOQL query as string.'}),
    result: flags.string({char: 'r', description: 'Relative path to save results of query.'})
  }

  async run() {
    const {flags} = this.parse(Query)
    const filePath = flags.file || 'query.sql'
    const resultPath = flags.result || 'query.csv'
    const queryString = flags.query || fs.readFileSync(getRelativePath(filePath), 'utf8')
    let options: dxOptions = {}
    options.query = queryString
    if (flags.username) options.targetusername = flags.username
    let queryResult = await sfdx.data.soqlQuery(options)
    queryResult.records.map(prepJsonForCsv)
    fs.writeFileSync(
      getRelativePath(resultPath), 
      csvjson.toCSV(queryResult.records, {headers: 'relative'}), 
      {encoding: 'utf-8'})
  }
}