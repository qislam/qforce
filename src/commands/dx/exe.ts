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
    username: flags.string({char: 'u'}),
    verbose: flags.boolean({char: 'v'}),
  }

  async run() {
    const {flags} = this.parse(Exe)
    if (flags.username) {
      sfdx.apex.execute({
        targetusername: flags.username,
        apexcodefile: path.join(process.cwd(), 'stuff', 'exe.cls')})
      .then( 
        (result: any) => fs.writeFileSync(path.join(process.cwd(), 'stuff', 'exe.log'), 
        result.logs, { encoding: 'utf-8' } ) 
      )
    } else {
      sfdx.apex.execute({apexcodefile: path.join(process.cwd(), 'stuff', 'exe.cls')})
        .then( 
          (result: any) => fs.writeFileSync(path.join(process.cwd(), 'stuff', 'exe.log'), 
          result.logs, { encoding: 'utf-8' } ) 
        )
    }
  }
}