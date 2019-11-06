import {Command, flags} from '@oclif/command'
import {getRelativePath, pollBulkStatus, prepJsonForCsv} from '../../helper/utility'
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
    const startIndex = MigrationPlan.startIndex || 0
    const stopIndex = MigrationPlan.stopIndex || MigrationPlan.steps.length
    for (let i = startIndex; i < stopIndex; i++) {
      let step: migrationStep = MigrationPlan.steps[i]
      if (step.skip) {
        this.log(i + ' - Step ' + step.name + ' - Skipped')
        continue;
      }
      this.log(i + ' - Step ' + step.name + ' - Started')
      if (step.query) {
        let options: dxOptions = {}
        options.query = step.query
        options.targetusername = flags.source
        let queryResult: any
        try {
          queryResult= await sfdx.data.soqlQuery(options)
        } catch(err) {
          this.log('Error in querying the data: ' + JSON.stringify(err))
          break
        }
        if (step.transform) queryResult.records.map(step.transform.bind(step))
        // remove attributes property and csv cleanup
        queryResult.records.map(prepJsonForCsv)
        
        fs.writeFileSync(
          path.join(process.cwd(), 'data', `${step.name}-data.csv`), 
          csvjson.toCSV(queryResult.records, {headers: 'relative'}), 
          {encoding: 'utf-8'}
        )
        this.log(i + ' - Step ' + step.name + ' - Query results saved.')
      }
      if (flags.destination) {
        let options: dxOptions = {}
        options.targetusername = flags.destination
        options.csvfile = path.join(process.cwd(), 'data', `${step.name}-data.csv`)
        options.externalid = step.externalid
        options.sobjecttype = step.sobjecttype
        let loadResults: any
        try {
          loadResults= await sfdx.data.bulkUpsert(options)
        } catch(err) {
          this.log('Error uploading data: ' + JSON.stringify(err))
          break
        }
        options = {}
        options.targetusername = flags.destination
        options.jobid = loadResults[0].jobId
        options.batchid = loadResults[0].id
        let pollResults: any
        try {
          pollResults = await pollBulkStatus(options, 300000, 10000)
        } catch(err) {
          this.log('Error in getting bulk status: ' + err)
          break
        }
        if(pollResults && pollResults.numberRecordsFailed > 0) {
          this.log('Some records did not get uploaded:\n' + JSON.stringify(pollResults))
          break
        }
        this.log(i + ' - Step ' + step.name + ' - Data uploaded.')
      }
    }
  }
}
