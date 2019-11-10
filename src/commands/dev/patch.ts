import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
const path = require('path')
const fs = require('fs')

export default class DevPatch extends Command {
  static description = 'describe the command here'
  static aliases = ['patch','dev:patch']

  static flags = {
    help: flags.help({char: 'h'}),
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'branchA'}, {name: 'branchB'}]

  async run() {
    cli.action.start('Processing patch')
    const {args, flags} = this.parse(DevPatch)
    let settings
    if (fs.existsSync(path.join(process.cwd(), '.qforce', 'settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.qforce', 'settings.json'))
      )
    }
    const branchA = args.branchA
    const branchB = args.branchB || settings.developBranch
    
  }
}
