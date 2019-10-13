import {Command, flags} from '@oclif/command'
const sfdx = require('sfdx-node');

export default class Dx extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ q dx
dx world from ./src/dx.ts!
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    orglist: flags.boolean({char: 'l'})
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Dx)

    if (flags.orglist) {
      sfdx.org.list().then((result) => this.log(result))
    }
  }
}
