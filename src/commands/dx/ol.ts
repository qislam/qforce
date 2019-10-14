import {Command, flags} from '@oclif/command'
const sfdx = require('sfdx-node');

export default class Ol extends Command {
  static description = 'List of available orgs.'

  static examples = [
    `$ q dx:ol`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
  }

  async run() {
    sfdx.org.list().then((result: any) => this.log(result))
  }
}
