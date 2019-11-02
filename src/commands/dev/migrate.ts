import {Command, flags} from '@oclif/command'
import {executeMigrationSteps} from '../../helper/migrateHelper'
import {dxOptions, looseObject, migrationStep} from '../../helper/interfaces'
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
    file: flags.string({char: 'f', description: 'Name of migration plan file'}),
  }

  async run() {
    if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
      fs.mkdirSync(path.join(process.cwd(), 'data'))
    }

    const {flags} = this.parse(Migrate)
    let planFile = ''
    if (flags.file) planFile = flags.file
    else planFile = 'migrationPlan'

    const MigrationPlan = await import(path.join(process.cwd(), planFile))
    console.log(MigrationPlan)
    let context: looseObject = {}
    context.flags = flags
    context.migrationPlan = MigrationPlan
    context.currentStepIndex = 0
    context.currentStepStage = 'Ready to start'
    executeMigrationSteps(context)
  }
}
