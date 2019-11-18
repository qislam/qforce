import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {dxOptions} from '../../helper/interfaces'
import {getAbsolutePath} from '../../helper/utility'
const path = require('path')
const fs = require('fs')
const sfdx = require('sfdx-node');

export default class DxDescribe extends Command {
  static description = 'describe the command here'
  static aliases = ['describe', 'dx:describe']

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u'}),
    sobject: flags.string({char: 's', required: true, description: 'sObject name.'}),
    result: flags.string({char: 'r', description: 'Relative path to save results.'})
  }

  async run() {
    cli.action.start('Getting sObject description')
    const {flags} = this.parse(DxDescribe)
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }
    const targetusername = flags.username || settings.targetusername
    if (!fs.existsSync(getAbsolutePath('.qforce'))) {
      fs.mkdirSync(getAbsolutePath('.qforce'))
    }
    if (!fs.existsSync(getAbsolutePath('.qforce/definitions'))) {
      fs.mkdirSync(getAbsolutePath('.qforce/definitions'))
    }
    if (!fs.existsSync(getAbsolutePath('.qforce/definitions/' + targetusername))) {
      fs.mkdirSync(getAbsolutePath('.qforce/definitions/' + targetusername))
    }
    const resultPath = flags.result || 
      settings.describeResultsPath || 
      settings.exeResultsPath || 
      'exe.log'
    let options: dxOptions = {}
    if (targetusername) options.targetusername = targetusername
    options.sobjecttype = flags.sobject
    let describeResults = await sfdx.schema.sobjectDescribe(options)
    fs.writeFileSync(
      getAbsolutePath('.qforce/definitions/' + 
        targetusername + '/' + flags.sobject.toLowerCase() + '.json'),
      JSON.stringify(describeResults, null, 2),
      {encoding: 'utf-8'})
    fs.writeFileSync(
      getAbsolutePath(resultPath), 
      JSON.stringify(describeResults, null, 2),
      {encoding: 'utf-8'})
    cli.action.stop()
  }
}
