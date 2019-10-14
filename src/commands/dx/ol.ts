import {Command, flags} from '@oclif/command'
const sfdx = require('sfdx-node');

export default class Ol extends Command {
  static description = 'List of available orgs.'

  static examples = [
    `$ q dx:ol`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {flags} = this.parse(Ol)
    if (flags.verbose) {
      sfdx.org.list().then((result: any) => this.log(result))
    } else {
      sfdx.org.list()
        .then((result: Object) => {
          for (let orgList of Object.values(result)) {
            for (let org of orgList) {
              let orgAlias = org.alias == undefined ? ''.padEnd(10) : org.alias.padEnd(10);
              this.log(`${orgAlias}\t${org.username.padEnd(35)}\t${org.instanceUrl}`)
            }
          }
        })
    }
  }
}
