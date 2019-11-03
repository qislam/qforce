import {Command, flags} from '@oclif/command'
import {dxOptions} from '../../helper/interfaces'
import {getRelativePath} from '../../helper/utility'
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
    file: flags.string({char: 'f', description: 'Relative path of apex file in unix format.'}),
    result: flags.string({char: 'r', description: 'Relative path to save results.'})
  }

  async run() {
    const {flags} = this.parse(Exe)
    const filePath = flags.file || 'exe.cls'
    const resultPath = flags.result || 'exe.log'
    let options: dxOptions = {}
    options.apexcodefile = getRelativePath(filePath)
    if (flags.username) options.targetusername = flags.username
    let exeResults = await sfdx.apex.execute(options)
    fs.writeFileSync(
      getRelativePath(resultPath), 
      exeResults.logs,
      {encoding: 'utf-8'})
  }
}