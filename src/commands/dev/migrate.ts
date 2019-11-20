import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {filterQueryFields, getAbsolutePath, getQueryAll, pollBulkStatus, prepJsonForCsv} from '../../helper/utility'
import {dxOptions, looseObject, migrationStep} from '../../helper/interfaces'
import {allSamples} from '../../helper/migPlanSamples'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

export default class Migrate extends Command {
  static description = 'Migrate data from one org to another based on a migration plan.'
  static aliases = ['migrate', 'm']

  static flags = {
    help: flags.help({char: 'h'}),
    destination: flags.string({char: 'd', description: 'destination org username or alias'}),
    file: flags.string({char: 'f', description: 'Path of migration plan file. Must be relative to cwd and in unix format.'}),
    sample: flags.boolean({description: 'Copy sample migration plan files to current directory.'}),
    source: flags.string({char: 's', description: 'source org username or alias'}),
  }

  async run() {
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'))
    }
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }
    const {flags} = this.parse(Migrate)
    if (flags.sample) {
      for(let key in allSamples) {
        fs.writeFileSync(
          getAbsolutePath(key + '.js'), 
          allSamples[key], 
          {encoding: 'utf-8'}
        )
      }
      return
    }
    let file = flags.file || 'migrationPlan.js'
    if(!fs.existsSync(getAbsolutePath(file))) {
      this.log('No plan file provided. Run "qforce dev:migrate --sample" to get a sample.')
    }
    const MigrationPlan = await import(getAbsolutePath(file))
    const startIndex = MigrationPlan.startIndex || 0
    const stopIndex = MigrationPlan.stopIndex || MigrationPlan.steps.length
    for (let i = startIndex; i < stopIndex; i++) {
      let step: migrationStep = MigrationPlan.steps[i]
      if (step.skip) {
        this.log(i + ' - Step ' + step.name + ' - Skipped')
        continue;
      }
      this.log(i + ' - Step ' + step.name + ' - Started')
      if (step.query && (flags.source || MigrationPlan.source)) {
        cli.action.start(i + ' - Step ' + step.name + ' querying data')
        const targetusername = flags.source || MigrationPlan.source
        let queryString = step.query
        if (queryString.includes('*')) {
          //queryString = getQueryAll(queryString, targetusername)
          let objectDefinition = await sfdx.schema.sobjectDescribe({
            targetusername: targetusername, 
            sobjecttype: step.sobjecttype
          })
          let fieldNames = ''
          for (let field of objectDefinition.fields) {
            if(!field.createable || 
              field.type == 'reference' || 
              (field.defaultedOnCreate && !field.updateable)) continue
            if (fieldNames) fieldNames = fieldNames + ', ' + field.name
            else fieldNames = field.name
          }
          if (fieldNames) queryString = queryString.replace(/\*/g, fieldNames)
        }
        let options: dxOptions = {}
        options.query = queryString
        options.targetusername = targetusername
        let queryResult: any
        try {
          queryResult= await sfdx.data.soqlQuery(options)
        } catch(err) {
          cli.action.stop('Error in querying the data: ' + JSON.stringify(err, null, 2))
          if(settings.ignoreError) continue
          else break
        }
        if (step.transform) queryResult.records.map(step.transform.bind(step))
        // remove attributes property and csv cleanup
        queryResult.records.map(prepJsonForCsv)
        
        fs.writeFileSync(
          path.join(process.cwd(), 'data', `${step.name}-data.csv`), 
          csvjson.toCSV(queryResult.records, {headers: 'relative'}), 
          {encoding: 'utf-8'}
        )
        cli.action.stop()
      } else {
        this.log('Query and username missing.')
        break
      }
      if (flags.destination || MigrationPlan.destination) {
        cli.action.start(i + ' - Step ' + step.name + ' uploading data')
        let options: dxOptions = {}
        options.targetusername = flags.destination || MigrationPlan.destination
        options.csvfile = path.join(process.cwd(), 'data', `${step.name}-data.csv`)
        if(step.externalid) options.externalid = step.externalid
        options.sobjecttype = step.sobjecttype
        let loadResults: any
        try {
          loadResults= await sfdx.data.bulkUpsert(options)
        } catch(err) {
          cli.action.stop()
          this.log('Error uploading data: ' + JSON.stringify(err, null, 2))
          if(MigrationPlan.ignoreError) continue
          else break
        }
        options = {}
        options.targetusername = flags.destination
        options.jobid = loadResults[0].jobId
        options.batchid = loadResults[0].id
        let pollResults: any
        try {
          pollResults = await pollBulkStatus(options
                                            , step.bulkStatusRetries
                                            , step.bulkStatusInterval)
        } catch(err) {
          cli.action.stop()
          this.log('Error in getting bulk status: ' + JSON.stringify(err, null, 2))
          if(MigrationPlan.ignoreError) continue
          else break
        }
        if(pollResults && pollResults.numberRecordsFailed > 0) {
          cli.action.stop()
          this.log('Some records did not get uploaded:\n' + JSON.stringify(pollResults, null, 2))
          if(MigrationPlan.ignoreError) continue
          else break
        }
        cli.action.stop()
      }
    }
  }
}
