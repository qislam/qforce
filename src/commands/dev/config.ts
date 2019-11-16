import {Command, flags} from '@oclif/command'
import { domainToUnicode } from 'url'
import { looseObject } from '../../helper/interfaces'
import {getAbsolutePath, getRelativePath} from '../../helper/utility'
const path = require('path')
const fs = require('fs')

export default class DevConfig extends Command {
  static description = 'describe the command here'
  static aliases = ['config', 'dev:config']

  static flags = {
    help: flags.help({char: 'h'}),
    init: flags.boolean({description: 'Initiate qforce settings.'}),
    global: flags.boolean({char: 'g', description: 'To set or retrieve setting from global.'}),
    targetusername: flags.string({char: 'u', description: 'Set or retrieve targetusername.'}),
    queryFilePath: flags.string({description: 'Path of query file to use with query command.'}),
    queryResultsPath: flags.string({description: 'Path to save results of query command.'}),
    exeFilePath: flags.string({description: 'Path to file to execute for exe command.'}),
    exeResultsPath: flags.string({description: 'Path to save log of exe command execution.'}),
    bulkStatusRetries: flags.integer({description: 'Number of retries to poll status of bulk job.'}),
    bulkStatusInterval: flags.integer({description: 'Interval in milliseconds for polling bluk job status.'}),
  }

  static args = [{name: 'file'}]

  doInit(flags:looseObject) {
    console.log(flags.targetusername)
    if (!fs.existsSync(getAbsolutePath('.qforce'))) {
      fs.mkdirSync(getAbsolutePath('.qforce'))
    }
    if (!fs.existsSync(getAbsolutePath('query.soql'))) {
      fs.writeFileSync(getAbsolutePath(
        'query.soql'), 
        'SELECT Id, Name FROM Account LIMIT 1', 
        {encoding: 'utf-8'}
      )
    }
    if (!fs.existsSync(getAbsolutePath('exe.cls'))) {
      fs.writeFileSync(getAbsolutePath(
        'exe.cls'), 
        'System.debug(UserInfo.getUserName());', 
        {encoding: 'utf-8'}
      )
    }
    const defaultSettings = {
      targetusername: "dev",
      queryFilePath: "query.soql",
      queryResultsPath: "queryResults.csv",
      exeFilePath: "exe.cls",
      exeResultsPath: "exe.log"
    }
    fs.writeFileSync(
      getAbsolutePath('.qforce/settings.json'), 
      JSON.stringify(defaultSettings, null, 2),
      {encoding: 'utf-8'}
    )
  }

  setConfig(flags:looseObject) {
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(fs.readFileSync(getAbsolutePath('.qforce/settings.json')))
    }
    for (let key in flags) {
      settings[key] = flags[key]
    }
    if (settings){
      fs.writeFileSync(
        getAbsolutePath('.qforce/settings.json'), 
        JSON.stringify(settings, null, 2),
        {encoding: 'utf-8'}
      )
    }
  }

  async run() {
    const {args, flags} = this.parse(DevConfig)
    if(flags.init) this.doInit(flags)
    else this.setConfig(flags)
  }
}