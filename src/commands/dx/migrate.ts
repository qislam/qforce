import {Command, flags} from '@oclif/command'
import {IDxOptions} from '../../helper/interfaces'
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
    const {flags} = this.parse(Migrate)
    const Migration = await import(path.join(process.cwd(), 'stuff', 'migrationPlan.ts'))
    let options: IDxOptions = {}
    options.query = Migration.Plan.steps[0].query
    if (flags.source) options.targetusername = flags.source
    sfdx.data.soqlQuery(options)
      .then(
        (result: any) => {
          result.records.map(Migration.Plan.steps[0].transform)
          this.log(result)
        }
      )
  }
}
