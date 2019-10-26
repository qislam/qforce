import {Command, flags} from '@oclif/command'
import {IDxOptions} from '../../helper/interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

function toCsv(items: any) {
  return csvjson.toCSV(
    items.records.map(
      (item: any) => {
        if (item.attributes) delete item.attributes; 
        for (let key of Object.keys(item)) {
          if(item[key].attributes) delete item[key].attributes
        }
        return item
      }
    ), 
    {headers: 'relative'}
  )
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
    let options: IDxOptions = {}
    options.query = queryString
    if (flags.username) options.targetusername = flags.username
    sfdx.data.soqlQuery(options)
    .then( 
      (result: any) => {
        fs.writeFileSync(path.join(process.cwd(), 'stuff', 'query.csv'), toCsv(result), {encoding: 'utf-8'})
      }  
    )
  }
}