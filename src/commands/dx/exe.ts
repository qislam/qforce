import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {dxOptions} from '../../helper/interfaces'
import {getRelativePath} from '../../helper/utility'
const sfdx = require('sfdx-node')
const path = require('path')
const fs = require('fs')

export default class Exe extends Command {
  static description = 'Execute anonymous apex.'
  static aliases = ['exe', 'dx:exe']

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
    cli.action.start('Executing anonymous script')
    const {flags} = this.parse(Exe)
    let settings
    if (fs.existsSync(path.join(process.cwd(), '.qforce', 'settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.qforce', 'settings.json'))
      )
    }
    const filePath = flags.file || settings.exeFilePath || 'exe.cls'
    const resultPath = flags.result || settings.exeResultsPath || 'exe.log'
    const targetusername = flags.username || settings.exeTargetusername || settings.targetusername
    let options: dxOptions = {}
    options.apexcodefile = getAbsolutePath\(filePath)
    if (targetusername) options.targetusername = targetusername
    let exeResults = await sfdx.apex.execute(options)
    fs.writeFileSync(
      getAbsolutePath\(resultPath), 
      exeResults.logs,
      {encoding: 'utf-8'})
    cli.action.stop()
  }
}