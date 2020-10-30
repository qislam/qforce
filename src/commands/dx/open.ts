import {Command, flags} from '@oclif/command'
import {dxOptions} from '../../helper/interfaces'
const path = require('path')
const fs = require('fs')
const sfdx = require('sfdx-node');

export default class Open extends Command {
  static description = 'Open an org.'
  static aliases = ['open', 'dx:open', 'o']

  static examples = [
    `$ q dx:open uat`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [
    {name: 'username', required: true}, 
    {name: 'path', required: false},
  ]

  async run() {
    const {args, flags} = this.parse(Open)

    let settings: any = {}, sfdxConfig: any = {}
    if (fs.existsSync(path.join(process.cwd(), '.qforce', 'settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.qforce', 'settings.json'))
      )
    }

    if (fs.existsSync(path.join(process.cwd(), '.sfdx', 'sfdx-config.json'))) {
      sfdxConfig = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.sfdx', 'sfdx-config.json'))
      )
    }
    let targetusername = args.username || settings.targetusername || sfdxConfig.defaultusername
    let openPath = ''
    if (args.path) {
      const idRegex = RegExp('[a-zA-Z0-9]{18}|[a-zA-Z0-9]{15}')
      if (args.path == 'setup') openPath = 'lightning/setup/SetupOneHome/home'
      else if (args.path == 'console') openPath = '_ui/common/apex/debug/ApexCSIPage'
      else if (idRegex.test(args.path)) openPath = `/${args.path}`
      else openPath = args.path
    }
    let options: dxOptions = {}
    if (targetusername) options.targetusername = targetusername
    if (openPath) options.path = openPath
    sfdx.org.open(options)
  }
}