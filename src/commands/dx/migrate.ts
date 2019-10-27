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
    destination: flags.string({char: 'd', description: 'destination org username or alias'}),
  }

  async run() {
    const {flags} = this.parse(Migrate)
    const Migration = await import(path.join(process.cwd(), 'migrationPlan.ts'))
    Migration.Plan.steps.forEach(executeMigrationStep, flags);
  }
}
