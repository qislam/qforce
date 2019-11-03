import {Command, flags} from '@oclif/command'
import {getDataBulkStatus, getRelativePath, prepJsonForCsv, poll} from '../../helper/utility'
import {dxOptions, looseObject, migrationStep} from '../../helper/interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

export default class Migrate extends Command {
  static description = 'Migrate data from one org to another based on a migration plan.'

  static flags = {
    help: flags.help({char: 'h'}),
    source: flags.string({char: 's', required: true, description: 'source org username or alias'}),
    destination: flags.string({char: 'd', description: 'destination org username or alias'}),
    file: flags.string({char: 'f', description: 'Path of migration plan file. Must be relative to cwd and in unix format.'}),
  }

  async run() {
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'))
    }
    const {flags} = this.parse(Migrate)
    let file = flags.file || 'migrationPlan.js'

    const MigrationPlan = await import(getRelativePath(file))
    
    for (let i = 0; i < MigrationPlan.steps.length; i++) {
      let step: migrationStep = MigrationPlan.steps[i]
      this.log(i + ' - Starting step ' + step.name)
      if (step.query) {
        let options: dxOptions = {}
        options.query = step.query
        options.targetusername = flags.source
        let queryResult = await sfdx.data.soqlQuery(options)
        if (step.transform) queryResult.records.map(step.transform.bind(step))
        // remove attributes property and csv cleanup
        queryResult.records.map(prepJsonForCsv)
        
        fs.writeFileSync(
          path.join(process.cwd(), 'data', `${step.name}-data.csv`), 
          csvjson.toCSV(queryResult.records, {headers: 'relative'}), 
          {encoding: 'utf-8'})
      }
      if (flags.destination) {
        let options: dxOptions = {}
        options.targetusername = flags.destination
        options.csvfile = path.join(process.cwd(), 'data', `${step.name}-data.csv`)
        options.externalid = step.externalid
        options.sobjecttype = step.sobjecttype
        const loadResults: any = await sfdx.data.bulkUpsert(options)
        options = {}
        options.targetusername = flags.destination
        options.jobid = loadResults[0].jobId
        options.batchid = loadResults[0].id
        const pollResult: any = await poll(getDataBulkStatus, 30000, 5000, options)
        this.log(pollResult)
      }
    }
  }
}
