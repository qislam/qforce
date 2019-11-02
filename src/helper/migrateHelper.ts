import {migrationStep, looseObject, dxOptions} from './interfaces'
import {poll, prepJsonForCsv} from './utility'
import {StepStage} from './enums'

const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

async function executeMigrationSteps(context: looseObject) {
  if (context.currentStepIndex >= context.migrationPlan.steps.length) {
    console.log('Process completed.')
    return
  }
  if (context.migrationPlan.steps[context.currentStepIndex].skip) {
    console.log('Skipping step at index ' + (context.currentStepIndex))
    context.currentStepIndex = context.currentStepIndex + 1
    if (context.currentStepIndex < context.migrationPlan.steps.length) {
      executeMigrationSteps(context)
    } else {
      console.log('Process completed.')
    }
  }
  if (context.currentStepIndex < context.migrationPlan.steps.length 
      && context.currentStepStage == 'Ready to start') {
    console.log('calling extractTransform for step ' + context.currentStepIndex)
    extractTransform(context)
  }
  if (context.currentStepIndex < context.migrationPlan.steps.length 
      && context.currentStepStage == 'Ready to load') {
    console.log('calling loadData for step ' + context.currentStepIndex)
    let loadResults = await handleLoad(context)
  }

}

function extractTransform(context: looseObject) {
  let step: migrationStep = context.migrationPlan.steps[context.currentStepIndex]
  let options: dxOptions = {}
  options.query = step.query
  if (context.flags.source) options.targetusername = context.flags.source
  sfdx.data.soqlQuery(options)
  .then(
    (result: any) => {
      // Binding this to allow access to props defined in project plan.
      if (step.transform) result.records.map(step.transform.bind(step))
      // remove attributes property and csv cleanup
      result.records.map(prepJsonForCsv)
      
      fs.writeFileSync(
        path.join(process.cwd(), 'data', `${step.name}-data.csv`), 
        csvjson.toCSV(result.records, {headers: 'relative'}), 
        {encoding: 'utf-8'})
      context.currentStepStage = 'Ready to load'
      executeMigrationSteps(context)
    }
  )
}

async function getDataBulkStatus(context: looseObject) {
  console.log('polling status for step ' + context.currentStepIndex)
  let options: dxOptions = {}
  let statusResults
  if (context.currentStepLog != null) {
    options.targetusername = context.flags.destination
    options.jobid = context.currentStepLog.jobId
    options.batchid = context.currentStepLog.id
    statusResults = await sfdx.data.bulkStatus(options)
    if (statusResults[0].state == 'Completed') {
      return statusResults[0]
    } else {
      return null
    }
}

async function handleLoad(context: looseObject) {
  let step: migrationStep = context.migrationPlan.steps[context.currentStepIndex]
  let options: dxOptions = {}
  options.targetusername = context.flags.destination
  options.csvfile = path.join(process.cwd(), 'data', `${step.name}-data.csv`)
  options.externalid = step.externalid
  options.sobjecttype = step.sobjecttype
  const loadResults = await sfdx.data.bulkUpsert(options)
  context.currentStepLog = loadResults[0]
  const pollResult = await poll(getDataBulkStatus, 30000, 5000, context)
  if(pollResult) return pollResult
  else return (new Error('Timed out while polling for results.'))
}

async function loadData(context: looseObject) {
  let step: migrationStep = context.migrationPlan.steps[context.currentStepIndex]
  if (context.flags.destination === undefined) {
    context.currentStepIndex = context.currentStepIndex + 1
    context.currentStepStage = 'Ready to start'
    if (context.currentStepIndex < context.migrationPlan.steps.length) {
      executeMigrationSteps(context)
    }
  } else {
    let options: dxOptions = {}
    options = {}
    options.targetusername = context.flags.destination
    options.csvfile = path.join(process.cwd(), 'data', `${step.name}-data.csv`)
    options.externalid = step.externalid
    options.sobjecttype = step.sobjecttype
    const loadResults = await sfdx.data.bulkUpsert(options)
    context.currentStepLog = loadResults[0]
    const pollResult = await poll(getDataBulkStatus, 30000, 5000, context)
    return pollResult
  }
}

export {executeMigrationSteps}