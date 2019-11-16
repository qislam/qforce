import {Command, flags} from '@oclif/command'
import {dxOptions} from '../../helper/interfaces'
const path = require('path')
const fs = require('fs')
const sfdx = require('sfdx-node');

export default class Open extends Command {
  static description = 'Open an org.'
  static aliases = ['open', 'dx:open', 'o']

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
    let settings
    if (fs.existsSync(path.join(process.cwd(), '.qforce', 'settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.qforce', 'settings.json'))
      )
    }
    const targetusername = flags.username || settings.targetusername
    let openPath = ''
    if (flags.path) {
      if (flags.path == 'setup') openPath = 'lightning/setup/SetupOneHome/home'
      else if (flags.path == 'console') openPath = '_ui/common/apex/debug/ApexCSIPage'
      else openPath = flags.path
    }
    let options: dxOptions = {}
    if (targetusername) options.targetusername = targetusername
    if (openPath) options.path = openPath
    sfdx.org.open(options)
  }
}