import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {dxOptions, looseObject} from '../../helper/interfaces'
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
    sobject: flags.string({char: 's', description: 'sObject name.'}),
    result: flags.string({char: 'r', description: 'Relative path to save results.'}),
    all: flags.boolean({char: 'a', description: 'To get all sObjects.'})
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
    if (!fs.existsSync(getAbsolutePath('.qforce/definitions'))) {
      fs.mkdirSync(getAbsolutePath('.qforce/definitions'), {recursive: true})
    }
    let objectsToDescribe = []
    if (flags.all) {
      let options: dxOptions = {}
      if (targetusername) options.targetusername = targetusername
      options.sobjecttypecategory = 'all'
      objectsToDescribe = await sfdx.schema.sobjectList(options)
    } else {
      objectsToDescribe.push(flags.sobject)
    }
    const resultPath = flags.result || 
      settings.describeResultsPath || 
      settings.exeResultsPath || 
      'exe.log'
    let sobjectByPrefix: looseObject = {}
    if (fs.existsSync(getAbsolutePath('.qforce/definitions/sobjectsByPrefix.json'))) {
      sobjectByPrefix = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/definitions/sobjectsByPrefix.json'))
      )
    }
    for (let sobject of objectsToDescribe) {
      let options: dxOptions = {}
      if (targetusername) options.targetusername = targetusername
      options.sobjecttype = sobject.toLowerCase()
      let describeResults = await sfdx.schema.sobjectDescribe(options)
      sobjectByPrefix[describeResults.keyPrefix] = sobject
      fs.writeFileSync(
        getAbsolutePath('.qforce/definitions/' + sobject.toLowerCase() + '.json'),
        JSON.stringify(describeResults, null, 2),
        {encoding: 'utf-8'})
      if (flags.sobject) {
        fs.writeFileSync(
          getAbsolutePath(resultPath), 
          JSON.stringify(describeResults, null, 2),
          {encoding: 'utf-8'})
      }
    }
    fs.writeFileSync(
      getAbsolutePath('.qforce/definitions/sobjectsByPrefix.json'),
      JSON.stringify(sobjectByPrefix, null, 2),
      {encoding: 'utf-8'})
    cli.action.stop()
  }
}
