import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
const execa = require('execa')

export default class DevUpdate extends Command {
  static description = 'Update package'
  static aliases = ['update', 'dev:update']

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(DevUpdate)
    cli.action.start('Updating qforce. Please wait... ')
    await execa.command('npm install -g qforce').stdout.pipe(process.stdout)
    cli.action.stop()
  }
}
