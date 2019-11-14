import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
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
  static aliases = ['query', 'q']

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
    cli.action.start('Querying data')
    const {flags} = this.parse(Query)
    let settings
    if (fs.existsSync(path.join(process.cwd(), '.qforce', 'settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.qforce', 'settings.json'))
      )
    }
    const filePath = flags.file || settings.queryFilePath || 'query.soql'
    const resultPath = flags.result || settings.queryResultsPath || 'query.csv'
    const queryString = flags.query || fs.readFileSync(getRelativePath(filePath), 'utf8')
    const targetusername = flags.username || settings.exeTargetusername || settings.targetusername
    let options: dxOptions = {}
    options.query = queryString
    if (targetusername) options.targetusername = targetusername
    let queryResult = await sfdx.data.soqlQuery(options)
    queryResult.records.map(prepJsonForCsv)
    fs.writeFileSync(
      getRelativePath(resultPath), 
      csvjson.toCSV(queryResult.records, {headers: 'relative'}), 
      {encoding: 'utf-8'})
    cli.action.stop()
  }
}