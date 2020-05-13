import {Command, flags} from '@oclif/command'
const execa = require('execa')

export default class DevUpdate extends Command {
  static description = 'Update package'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(DevUpdate)

    execa.command('npm install -g qforce').stdout.pipe(process.stdout)
  }
}
