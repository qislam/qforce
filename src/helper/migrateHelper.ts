import {migrationStep, csvLine, dxOptions} from './interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

function executeMigrationStep(step: migrationStep) {
  console.log('I am being called')
  let options: dxOptions = {}
  options.query = step.query
  if (this.flags.source) options.targetusername = this.flags.source
  sfdx.data.soqlQuery(options)
    .then(
      (result: any) => {
        // remove attributes property
        result.records.map( (line: csvLine) => {
          if (line.attributes) delete line.attributes
          for (let key of Object.keys(line)) {
            if(line[key].attributes) delete line[key].attributes
          }
        })
        if (step.transform) result.records.map(step.transform)
        fs.writeFileSync(
          path.join(process.cwd(), 'stuff', `${step.name}-data.csv`), 
          csvjson.toCSV(result.records, {headers: 'relative'}), 
          {encoding: 'utf-8'})
      }
    )
}

export {executeMigrationStep}