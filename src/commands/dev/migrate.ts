import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import * as moment from 'moment'
import {deleteFolderRecursive, 
  getAbsolutePath, 
  getQueryAll, 
  getProp,
  handleNullValues,
  pollBulkStatus, 
  prepJsonForCsv,
  setStepReferences} from '../../helper/utility'
import {dxOptions, looseObject, migrationStep} from '../../helper/interfaces'
import {allSamples} from '../../helper/migPlanSamples'
import {random} from '../../helper/random'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')
const lodash = require('lodash')
const sha1 = require('js-sha1')
const debug = require('debug')('qforce')

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
    clearDataFolder: flags.boolean(),
    clearRefFolder: flags.boolean(),
  }

  async run() {
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }
    debug('settings: \n' + JSON.stringify(settings, null, 4))

    const {flags} = this.parse(Migrate)
    debug('flags: \n' + JSON.stringify(flags, null, 4))

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
    if(!fs.existsSync(getAbsolutePath(file)) && settings.migrateBasePath) {
      file = settings.migrateBasePath + '/' + file
    }
    debug('file: ' + file)

    if(!fs.existsSync(getAbsolutePath(file))) {
      this.log('No plan file provided. Run "qforce dev:migrate --sample" to get a sample.')
    }

    let basePath = file.split('/')
    basePath.pop()
    debug('basePath: ' + basePath)

    let dataPath = basePath.slice()
    dataPath.push('data')
    debug('dataPath: ' + dataPath)

    let refPath = basePath.slice()
    refPath.push('reference')
    debug('refPath: ' + refPath)

    if(flags.clearDataFolder) {
      if(fs.existsSync(path.join(process.cwd(), ...dataPath))) {
        deleteFolderRecursive(dataPath.join('/'))
      }
    }
    if(flags.clearRefFolder) {
      if(fs.existsSync(path.join(process.cwd(), ...refPath))) {
        deleteFolderRecursive(refPath.join('/'))
      }
    }
    
    const migrationPlan = await import(getAbsolutePath(file))

    const globalVars: looseObject = {
      moment: moment,
      random: random,
      lodash: lodash,
      sha1: sha1,
      getProp: getProp,
      plan: migrationPlan
    }

    if (migrationPlan.calculateFlags) {
      debug('calculateFlags started.')
      for (let key in globalVars) {
        if (key != 'plan') migrationPlan[key] = globalVars[key]
      }
      migrationPlan.calculateFlags.call(migrationPlan)
      debug('calculateFlags ended.')
    }
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
      debug(step.name + ' started.')

      if (flags.name) {
        if (step.name != flags.name) continue
      }
      this.log(i + ' - Step ' + step.name + ' - Started')
      //step['random'] = random
      for (let key in globalVars) {
        step[key] = globalVars[key]
      }
      if (step.references) {
        step = setStepReferences(step, basePath.join('/'))
      }
      if (step.calculateFlags) {
        step.calculateFlags.call(step)
      } 
      if (step.skip) {
        this.log(i + ' - Step ' + step.name + ' - Skipped')
        continue;
      }
      if (step.apexCodeFile && (flags.destination || migrationPlan.destination)) {
        let apexCodePath: string = getAbsolutePath(step.apexCodeFile)
        debug('apexCodePath: ' + apexCodePath)

        if (!fs.existsSync(apexCodePath)) {
          this.log(apexCodePath + ' does not exist')
          apexCodePath = getAbsolutePath(basePath.join('/') + '/' + step.apexCodeFile)
          this.log('Checking at ' + apexCodePath)
        }
        if (!fs.existsSync(apexCodePath)) {
          this.log(apexCodePath + ' does not exist')
          this.log('Path must be relative to project base or migration plan file.')
          continue
        }
        let options: dxOptions = {}
        options.apexcodefile = apexCodePath
        options.targetusername = flags.destination || migrationPlan.destination
        let exeResults = await sfdx.apex.execute(options)
        debug('exeResults: \n' + JSON.stringify(exeResults, null, 4))

        if (exeResults && exeResults.logs) this.log(exeResults.logs)
        continue;
      }
      if (step.generateData && !step.query) {
        let generatedData = step.generateData.call(step)
        if (generatedData.length < 1) {
          const manualCheck = await cli.confirm('No data generated. Continue?')
          if (!manualCheck) break
        }
        generatedData.map(prepJsonForCsv)
        if(!fs.existsSync(path.join(process.cwd(), ...dataPath))) {
          fs.mkdirSync(path.join(process.cwd(), ...dataPath), {recursive: true})
        }
        fs.writeFileSync(
          path.join(process.cwd(), ...dataPath, `${step.name}.csv`), 
          csvjson.toCSV(generatedData, {headers: 'relative', wrap: true}), 
          {encoding: 'utf-8'}
        )
      }
      if (step.query && 
          (
            step.queryDestination 
            || step.isDelete 
            || flags.source 
            || migrationPlan.source
            || step.source
          )) {
        cli.action.start(i + ' - Step ' + step.name + ' querying data')
        let targetusername;
        if (step.queryDestination || step.isDelete) {
          targetusername = flags.destination || migrationPlan.destination || step.destination
        } else {
          targetusername = flags.source || migrationPlan.source || step.source
        }
        debug('targetusername: ' + targetusername)

        let queryString: any = step.query
        if (queryString.includes('*')) {
          queryString = await getQueryAll(queryString, targetusername, true)
        }
        debug('queryString: ' + queryString)
        
        let options: dxOptions = {}
        options.query = queryString
        options.targetusername = targetusername
        let queryResult: any
        try {
          queryResult = await sfdx.data.soqlQuery(options)
        } catch(err) {
          cli.action.stop('Error in querying the data: ' + JSON.stringify(err, null, 2))
          if(settings.ignoreError) continue
          else break
        }
        debug('Before Transform queryResult: \n' + JSON.stringify(queryResult, null, 4))

        queryResult.records.map(handleNullValues)
        if (step.transform) queryResult.records.map(step.transform.bind(step))
        if (step.transformAll) {
          queryResult.records = step.transformAll.call(step, queryResult.records)
        }
        debug('Before Transform queryResult: \n' + JSON.stringify(queryResult, null, 4))

        if(step.referenceOnly || step.isReference) {
          if(!fs.existsSync(path.join(process.cwd(), ...refPath))) {
            fs.mkdirSync(path.join(process.cwd(), ...refPath), {recursive: true})
          }
          fs.writeFileSync(
            path.join(process.cwd(), ...refPath, `${step.name}.json`), 
            JSON.stringify(queryResult.records), 
            {encoding: 'utf-8'}
          )
        } 
        // remove attributes property and csv cleanup
        queryResult.records.map(prepJsonForCsv)
        debug('Prep for CSV queryResult: \n' + JSON.stringify(queryResult, null, 4))

        if (!step.referenceOnly) {
          if(!fs.existsSync(path.join(process.cwd(), ...dataPath))) {
            fs.mkdirSync(path.join(process.cwd(), ...dataPath), {recursive: true})
          }
          fs.writeFileSync(
            path.join(process.cwd(), ...dataPath, `${step.name}.csv`), 
            csvjson.toCSV(queryResult.records, {headers: 'relative', wrap: true}), 
            {encoding: 'utf-8'}
          )
        }
        cli.action.stop()
      } 

      if (step.referenceOnly) continue
      let loadResults: any
      if (step.isDelete) {
        cli.action.start(i + ' - Step ' + step.name + ' deleting data')
        let options: dxOptions = {
          json: true, 
          _rejectOnError: true}
        options.targetusername = flags.destination || migrationPlan.destination || step.destination
        options.csvfile = path.join(process.cwd(), ...dataPath, `${step.name}.csv`)
        options.sobjecttype = step.sobjecttype || step.sObjectType
        debug('bulkDelete options: \n' + JSON.stringify(options, null, 4))

        try {
          loadResults = await sfdx.data.bulkDelete(options)
          this.log(loadResults)
        } catch(err) {
          cli.action.stop()
          this.log('Error uploading data: ' + JSON.stringify(err, null, 2))
          if(migrationPlan.ignoreError) continue
          const manualCheck = await cli.confirm('Check status in your org. Continue?')
          if (manualCheck) continue
          else break
        }
      } else if (flags.destination || migrationPlan.destination || step.destination) {
        cli.action.start(i + ' - Step ' + step.name + ' uploading data')
        let options: dxOptions = {
          json: true, 
          _rejectOnError: true}
        options.targetusername = flags.destination || migrationPlan.destination || step.destination
        options.csvfile = path.join(process.cwd(), ...dataPath, `${step.name}.csv`)
        if(step.externalid || step.externalId) options.externalid = step.externalid || step.externalId
        options.sobjecttype = step.sobjecttype || step.sObjectType
        debug('bulkUpsert options: \n' + JSON.stringify(options, null, 4))

        try {
          loadResults = await sfdx.data.bulkUpsert(options)
          this.log('Load Results: ' + JSON.stringify(loadResults, null, 4))
        } catch(err) {
          cli.action.stop()
          this.log('Error uploading data: ' + JSON.stringify(err, null, 4))
          if(migrationPlan.ignoreError) continue
          else break
        }
        if (!loadResults) {
          const manualCheck = await cli.confirm('Check status in your org. Continue?')
          if (manualCheck) continue
        }
      }

      if (!loadResults) continue
      let options: dxOptions = {
        json: true, 
        _rejectOnError: true}
      let pollResults: any

      try {
        options.targetusername = flags.destination || migrationPlan.destination
        options.jobid = loadResults[0].jobId
        options.batchid = loadResults[0].id
        debug('bulkUpsert Status check options: \n' + JSON.stringify(options, null, 4))

        pollResults = await pollBulkStatus(options
          , migrationPlan.bulkStatusRetries
          , migrationPlan.bulkStatusInterval)
        this.log('Poll Results: ' + JSON.stringify(pollResults, null, 4))
      } catch(err) {
        cli.action.stop()
        this.log('Error in getting bulk status: ' + JSON.stringify(err, null, 4))
        const manualCheck = await cli.confirm('Check status in your org. Continue?')
        if (manualCheck) continue
        else break
      }

      if(pollResults && pollResults.numberRecordsFailed > 0) {
        cli.action.stop()
        this.log('Some records did not get uploaded:\n' + JSON.stringify(pollResults, null, 4))
        if(migrationPlan.ignoreError) continue
        const manualCheck = await cli.confirm('Continue?')
        if (manualCheck) continue
        else break
      }
      debug(step.name + ' finished.')

      cli.action.stop()
    }
  }
}
