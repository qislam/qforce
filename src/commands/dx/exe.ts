import {Command, flags} from '@oclif/command'
import {dxOptions} from '../../helper/interfaces'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')

export default class Exe extends Command {
  static description = 'Execute anonymous apex.'

  static examples = [
    `$ q dx:exe`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u'}),
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {flags} = this.parse(Exe)
    let options: dxOptions = {}
    options.apexcodefile = path.join(process.cwd(), 'stuff', 'exe.cls')
    if (flags.username) options.targetusername = flags.username
    sfdx.apex.execute(options)
    .then( 
      (result: any) => fs.writeFileSync(path.join(process.cwd(), 'stuff', 'exe.log'), 
      result.logs, { encoding: 'utf-8' } ) 
    )
    .catch( (err: any) => this.log(err))
  }
}