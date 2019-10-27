import {migrationStep, looseObject, dxOptions} from './interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

function executeMigrationSteps() {
  let step: migrationStep = this.migrationPlan.steps[0]
  if (step.skip) return
  let options: dxOptions = {}
  options.query = step.query
  if (this.flags.source) options.targetusername = this.flags.source
  if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'))
  }
  if (!fs.existsSync(path.join(process.cwd(), 'apex'))) {
    fs.mkdirSync(path.join(process.cwd(), 'apex'))
  }
  sfdx.data.soqlQuery(options)
  .then(
    (result: any) => {
      // Binding this to allow access to props defined in project plan.
      if (step.transform) result.records.map(step.transform.bind(step))
      // remove attributes property and csv cleanup
      result.records.map( (line: looseObject) => {
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
      })
      
      fs.writeFileSync(
        path.join(process.cwd(), 'data', `${step.name}-data.csv`), 
        csvjson.toCSV(result.records, {headers: 'relative'}), 
        {encoding: 'utf-8'})
      if (this.flags.destination) {
        options = {}
        options.targetusername = this.flags.destination
        options.csvfile = path.join(process.cwd(), 'data', `${step.name}-data.csv`)
        options.externalid = step.externalid
        options.sobjecttype = step.sobjecttype
        options.loglevel = 'trace'
        console.log(options)
        sfdx.data.bulkUpsert(options)
        .then(
          (result:any) => {
            console.log(result)
          }
        )
      }
    })
}

export {executeMigrationSteps}