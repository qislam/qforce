import {migrationStep, looseObject, dxOptions} from './interfaces'
import {poll, prepJsonForCsv} from './utility'

const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

function executeMigrationSteps(context: looseObject) {
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
  if (context.currentStepIndex < context.migrationPlan.steps.length && context.currentStepStage == 'Ready to start') {
    console.log('calling extractTransform for step ' + context.currentStepIndex)
    extractTransform(context)
  }
  if (context.currentStepIndex < context.migrationPlan.steps.length && context.currentStepStage == 'Ready to load') {
    console.log('calling loadData for step ' + context.currentStepIndex)
    loadData(context)
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

function getDataBulkStatus(context: looseObject) {
  console.log('polling status for step ' + context.currentStepIndex)
  let options: dxOptions = {}
  if (context.currentStepLog != null) {
    options.targetusername = context.flags.destination
    options.jobid = context.currentStepLog.jobId
    options.batchid = context.currentStepLog.id
    sfdx.data.bulkStatus(options)
    .then(
      (result: any) => {
        console.log(result[0])
        if (result[0].state == 'Completed') {
          context.currentStepCompleted = true
          context.currentStepLog = null
          context.currentStepIndex = context.currentStepIndex + 1
          context.currentStepStage = 'Ready to start'
          if(context.currentStepIndex < context.migrationPlan.steps.length) {
            executeMigrationSteps(context)
          }
        }
      }
    )
  }
  if (context.currentStepLog == null) return context
  if (context.currentStepCompleted) return context
  else return null
}

function loadData(context: looseObject) {
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
    sfdx.data.bulkUpsert(options)
    .then(
      (result:any) => {
        context.currentStepLog = result[0]
        context.currentStepCompleted = false
        poll(getDataBulkStatus, 30000, 5000, context)
        .then( (result: any) => {
          context = result
          context.currentStepCompleted = false;
        })
        .catch(
          (result: any) => console.log(result)
        )
      }
    )
  }
}

export {executeMigrationSteps}