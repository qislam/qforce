import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {deleteFolderRecursive, getAbsolutePath} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
const path = require('path')
const fs = require('fs')
const execa = require('execa')
const YAML = require('yaml')

export default class DevRetrieve extends Command {
  static description = 'To retrieve metadat based on items listed in a YAML file.'
  static aliases = ['retrieve', 'dev:retrieve']

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u'}),
    file: flags.string({char: 'f', description: 'Relative path of YAML file in unix format.'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(DevRetrieve)
    let settings, sfdxConfig
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }
    if (fs.existsSync(path.join(process.cwd(), '.sfdx', 'sfdx-config.json'))) {
      sfdxConfig = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.sfdx', 'sfdx-config.json'))
      )
    }
    const targetusername = flags.username || settings.targetusername || sfdxConfig.defaultusername

    let retrieveYAML: looseObject
    let filePath = flags.file || 'feature.yml'
    if (!fs.existsSync(getAbsolutePath(filePath))) {
      filePath = settings.retrieveBasePath + '/' + filePath
    }
    if (!fs.existsSync(getAbsolutePath(filePath))) {
      cli.action.stop('File not found')
    }
    retrieveYAML = YAML.parse(fs.readFileSync(filePath, 'utf-8'))
    for (let metadataType in retrieveYAML) {
      if (retrieveYAML[metadataType]) {
        for (let metadataName of retrieveYAML[metadataType]) {
          let command = `sfdx force:source:retrieve -m ${metadataType}:${metadataName} -u ${targetusername}`
          let result = execa.commandSync(command)
          this.log(JSON.stringify(result, null, 4))
        }
      } else {
        let command = `sfdx force:source:retrieve -m ${metadataType} -u ${targetusername}`
        let result = execa.commandSync(command)
        this.log(JSON.stringify(result, null, 4))
      }
      
    }
    cli.action.stop()
  }
}
