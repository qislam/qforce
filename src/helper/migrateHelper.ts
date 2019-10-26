import {migrationStep, dxOptions} from './interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

function executeMigrationStep(step: migrationStep, flags: any) {
  console.log('I am being called')
  let options: dxOptions = {}
  options.query = step.query
  if (flags.source) options.targetusername = flags.source
  sfdx.data.soqlQuery(options)
    .then(
      (result: any) => {
        result.records.map(step.transform)
        fs.writeFileSync(path.join(process.cwd(), 'stuff', 'query.csv'), csvjson.toCSV(result.records, {headers: 'relative'}), {encoding: 'utf-8'})
      }
    )
}

export {executeMigrationStep}