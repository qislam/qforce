import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {deleteFolderRecursive, 
  getAbsolutePath, 
  getQueryAll, 
  handleNullValues,
  pollBulkStatus, 
  prepJsonForCsv,
  setStepReferences} from '../../helper/utility'
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
    source: flags.string({char: 's', description: 'source org username or alias.'}),
    name: flags.string({char: 'n', description: 'Name of the step to execute.'}),
  }

  async run() {
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
    let basePath = file.split('/')
    basePath.pop()

    let dataPath = basePath.slice()
    dataPath.push('data')

    let refPath = basePath.slice()
    refPath.push('reference')
    
    const migrationPlan = await import(getAbsolutePath(file))
    // Clear data folder will delete all existing csv files in data folder
    if(migrationPlan.clearDataFolder) {
      if(fs.existsSync(path.join(process.cwd(), ...dataPath))) {
        deleteFolderRecursive(dataPath.join('/'))
      }
    }
    if(migrationPlan.clearRefFolder) {
      if(fs.existsSync(path.join(process.cwd(), ...refPath))) {
        deleteFolderRecursive(refPath.join('/'))
      }
    }
    const startIndex = migrationPlan.startIndex || 0
    const stopIndex = migrationPlan.stopIndex || migrationPlan.steps.length
    for (let i = startIndex; i < stopIndex; i++) {
      let step: migrationStep = migrationPlan.steps[i]
      if (!step.name) continue;
      if (flags.name) {
        if (step.name != flags.name) continue
      }
      this.log(i + ' - Step ' + step.name + ' - Started')
      if (step.skip) {
        this.log(i + ' - Step ' + step.name + ' - Skipped')
        continue;
      }
      if (step.apexCodeFile && (flags.destination || migrationPlan.destination)) {
        let options: dxOptions = {}
        options.apexcodefile = getAbsolutePath(step.apexCodeFile)
        options.targetusername = flags.destination || migrationPlan.destination
        let exeResults = await sfdx.apex.execute(options)
        if (exeResults && exeResults.logs) this.log(exeResults.logs)
        continue;
      }
      if (step.references) {
        step = setStepReferences(step, basePath.join('/'))
      }
      if (step.query && (flags.source || migrationPlan.source)) {
        cli.action.start(i + ' - Step ' + step.name + ' querying data')
        let targetusername = flags.source || migrationPlan.source
        if (step.queryDestination) {
          targetusername = flags.destination || migrationPlan.destination
        }
        let queryString: any = step.query
        if (queryString.includes('*')) {
          queryString = await getQueryAll(queryString, targetusername, true)
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
        queryResult.records.map(handleNullValues)
        if (step.transform) queryResult.records.map(step.transform.bind(step))
        if (step.transformAll) {
          queryResult.records = step.transformAll.call(step, queryResult.records)
        } 
        // remove attributes property and csv cleanup
        queryResult.records.map(prepJsonForCsv)

        if(step.referenceOnly) {
          if(!fs.existsSync(path.join(process.cwd(), ...refPath))) {
            fs.mkdirSync(path.join(process.cwd(), ...refPath), {recursive: true})
          }
          fs.writeFileSync(
            path.join(process.cwd(), ...refPath, `${step.name}.csv`), 
            csvjson.toCSV(queryResult.records, {headers: 'relative'}), 
            {encoding: 'utf-8'}
          )
        } else {
          if(!fs.existsSync(path.join(process.cwd(), ...dataPath))) {
            fs.mkdirSync(path.join(process.cwd(), ...dataPath), {recursive: true})
          }
          fs.writeFileSync(
            path.join(process.cwd(), ...dataPath, `${step.name}.csv`), 
            csvjson.toCSV(queryResult.records, {headers: 'relative'}), 
            {encoding: 'utf-8'}
          )
        }
        cli.action.stop()
      } 
      if (step.referenceOnly) continue
      if (flags.destination || migrationPlan.destination) {
        cli.action.start(i + ' - Step ' + step.name + ' uploading data')
        let options: dxOptions = {}
        options.targetusername = flags.destination || migrationPlan.destination
        options.csvfile = path.join(process.cwd(), ...dataPath, `${step.name}.csv`)
        if(step.externalid) options.externalid = step.externalid || step.externalId
        options.sobjecttype = step.sobjecttype || step.sObjectType
        let loadResults: any
        try {
          loadResults = await sfdx.data.bulkUpsert(options)
        } catch(err) {
          cli.action.stop()
          this.log('Error uploading data: ' + JSON.stringify(err, null, 2))
          if(migrationPlan.ignoreError) continue
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
          if(migrationPlan.ignoreError) continue
          else break
        }
        if(pollResults && pollResults.numberRecordsFailed > 0) {
          cli.action.stop()
          this.log('Some records did not get uploaded:\n' + JSON.stringify(pollResults, null, 2))
          if(migrationPlan.ignoreError) continue
          else break
        }
        cli.action.stop()
      }
    }
  }
}
