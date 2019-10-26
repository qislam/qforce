import {Command, flags} from '@oclif/command'
import {executeMigrationStep} from '../../helper/migrateHelper'
import {dxOptions, csvLine, migrationStep} from '../../helper/interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')
const csvjson = require('csvjson')

export default class Migrate extends Command {
  static description = 'Migrate data from one org to another based on a migration plan.'

  static flags = {
    help: flags.help({char: 'h'}),
    source: flags.string({char: 's', required: true, description: 'source org username or alias'}),
    target: flags.string({char: 'd', description: 'destination org username or alias'}),
  }

  async run() {
    this.log(executeMigrationStep.prototype)
    const {flags} = this.parse(Migrate)
    const Migration = await import(path.join(process.cwd(), 'stuff', 'migrationPlan.ts'))
    Migration.Plan.steps.forEach( (step: migrationStep) => {
      let options: dxOptions = {}
      options.query = step.query
      if (flags.source) options.targetusername = flags.source
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
    });
  }
}
