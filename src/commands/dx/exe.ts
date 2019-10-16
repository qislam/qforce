import {Command, flags} from '@oclif/command'
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
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {flags} = this.parse(Exe)
    sfdx.apex.execute({apexcodefile: path.join(process.cwd(), 'stuff', 'exe.cls')})
      .then( 
        (result: Object) => fs.writeFileSync(path.join(process.cwd(), 'stuff', 'exe.log'), 
        result.logs, { encoding: 'utf-8' } ) 
      )
  }
}