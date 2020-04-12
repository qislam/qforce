import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {dxOptions} from '../../helper/interfaces'
import {getAbsolutePath, getQueryAll, prepJsonForCsv} from '../../helper/utility'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

export default class Query extends Command {
  static description = 'Run a SOQL and save results to csv.'
  static aliases = ['query', 'q', 'dx:query']

  static examples = [
    `$ qforce dx:query`,
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
    let settings, sfdxConfig
    if (fs.existsSync(path.join(process.cwd(), '.qforce', 'settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.qforce', 'settings.json'))
      )
    }

    if (fs.existsSync(path.join(process.cwd(), '.sfdx', 'sfdx-config.json'))) {
      sfdxConfig = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.sfdx', 'sfdx-config.json'))
      )
    }

    const filePath = flags.file || settings.queryFilePath || 'query.soql'
    const resultPath = flags.result || settings.queryResultsPath || 'query.csv'
    if (resultPath.includes('/')) {
      let resultPathArray = resultPath.split('/')
      resultPathArray.pop()
      if(!fs.existsSync(path.join(process.cwd(), ...resultPathArray))) {
        fs.mkdirSync(path.join(process.cwd(), ...resultPathArray), {recursive: true})
      }
    }
    
    let targetusername = flags.username || settings.targetusername || sfdxConfig.defaultusername
    let queryString = flags.query || fs.readFileSync(getAbsolutePath(filePath), 'utf8')

    if (queryString.startsWith('//')) {
      const firstLine = queryString.split(/\n/, 1)[0]
      targetusername = firstLine.substring(2,).trim()
      queryString = queryString.substring(queryString.toLowerCase().indexOf('\n'),)
    }

    queryString = queryString.trim()
    if (!queryString.toLowerCase().includes('select')) {
      let sobjectMapPath = getAbsolutePath('.qforce/definitions/sobjectsByPrefix.json')
      if (!fs.existsSync(sobjectMapPath)) {
        cli.action.stop('Mapping file does not exist.')
        return
      }
      let sobjectByPrefix = JSON.parse(fs.readFileSync(sobjectMapPath))
      let sobject = sobjectByPrefix[queryString.substring(0,3)]
      queryString = 'SELECT * FROM ' + sobject + ' WHERE ID = \'' + queryString + '\''
    }
    if (queryString.includes('*')) {
      try {
      queryString = await getQueryAll(queryString, targetusername, false)
      this.log('Complete Query: \n' + queryString)
      } catch(err) {
        cli.action.stop('Receied error: ' + err)
        return
      }
    }
    let options: dxOptions = {}
    options.query = queryString
    if (targetusername) options.targetusername = targetusername
    let queryResult = await sfdx.data.soqlQuery(options)
    queryResult.records.map(prepJsonForCsv)
    fs.writeFileSync(
      getAbsolutePath(resultPath), 
      csvjson.toCSV(queryResult.records, {headers: 'relative', wrap: true}), 
      {encoding: 'utf-8'})
    cli.action.stop()
  }
}