import {Command, flags} from '@oclif/command'
import {dxOptions} from '../../helper/interfaces'
const sfdx = require('sfdx-node');

export default class Open extends Command {
  static description = 'Open an org.'

  static examples = [
    `$ q dx:open -u uat`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u'}),
    path: flags.string({char: 'p'}),
  }

  async run() {
    const {flags} = this.parse(Open)
    let path = ''
    if (flags.path) {
      if (flags.path == 'setup') path = 'lightning/setup/SetupOneHome/home'
      else if (flags.path == 'console') path = '_ui/common/apex/debug/ApexCSIPage'
      else path = flags.path
    }
    let options: dxOptions = {}
    if (flags.username) options.targetusername = flags.username
    if (path) options.path = path
    sfdx.org.open(options)
  }
}