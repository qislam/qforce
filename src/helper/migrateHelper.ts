import {migrationStep, looseObject, dxOptions} from './interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

function executeMigrationSteps(context: looseObject) {
  if (context.currentStepIndex == context.migrationPlan.steps.length) {
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
    console.log('calling extractTransform')
    extractTransform(context)
  }
  if (context.currentStepIndex < context.migrationPlan.steps.length && context.currentStepStage == 'Ready to load') {
    console.log('calling loadData')
    loadData(context)
  }

}

function prepJsonForCsv(line: looseObject) {
  if (line.attributes) delete line.attributes
  for (let key of Object.keys(line)) {
    if (typeof line[key] === 'string') {
      line[key] = line[key].replace(/"/g, '""')
    } 
    if (line[key] == 'null') line[key] = ''
    line[key] = '"' + line[key] + '"'
    if (line[key].attributes) {
      delete line[key].attributes
      for (let innerKey of Object.keys(line[key])) {
        if (typeof line[key][innerKey] === 'string') {
          line[key][innerKey] = line[key][innerKey].replace(/"/g, '""')
        } 
        if (line[key][innerKey] == 'null') line[key][innerKey] = ''
        line[key][innerKey] = '"' + line[key][innerKey] + '"'
      }
    } 
  }
  return line
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
        console.log(result)
        context.currentStepLog = result
        context.currentStepIndex = context.currentStepIndex + 1
        context.currentStepStage = 'Ready to start'
        if (context.currentStepIndex < context.migrationPlan.steps.length) {
          executeMigrationSteps(context)
        }
      }
    )
  }
}

export {executeMigrationSteps}