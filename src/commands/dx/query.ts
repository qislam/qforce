import {Command, flags} from '@oclif/command'
import {dxOptions} from '../../helper/interfaces'
import {prepJsonForCsv} from '../../helper/utility'
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
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {flags} = this.parse(Query)
    const queryString = fs.readFileSync(path.join(process.cwd(), 'stuff', 'query.sql'), 'utf8')
    let options: dxOptions = {}
    options.query = queryString
    if (flags.username) options.targetusername = flags.username
    sfdx.data.soqlQuery(options)
    .then( 
      (result: any) => {
        result.records.map(prepJsonForCsv)
        fs.writeFileSync(path.join(process.cwd(), 'stuff', 'query.csv'), csvjson.toCSV(result.records, {headers: 'relative'}), {encoding: 'utf-8'})
      }  
    )
  }
}