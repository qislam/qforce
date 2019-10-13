import {Command, flags} from '@oclif/command'
const sfdx = require('sfdx-node');

export default class Dx extends Command {
  static description = 'Shortcuts for commonly used sfdx commands'

  static examples = [
    `$ q dx -l`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    orglist: flags.boolean({char: 'l'})
  }

  async run() {
    const {args, flags} = this.parse(Dx)

    if (flags.orglist) {
      sfdx.org.list().then((result) => this.log(result))
    }
  }
}
