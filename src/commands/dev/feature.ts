import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {deleteFolderRecursive, getAbsolutePath} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
const path = require('path')
const fs = require('fs')
const execa = require('execa')
const YAML = require('yaml')

export default class DevFeature extends Command {
  static description = 'To retrieve and deploy source based on YAML file.'

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.boolean({description: 'Start a new feature. Will create YAML file and folder if not already exist.'}),
    retrieve: flags.boolean({description: 'Retrieve source based on YAML configuration.'}),
    deploy: flags.boolean({description: 'Deploys source already retrieved.'}),
    username: flags.string({char: 'u'}),
  }

  static args = [{name: 'featureName'}]

  async run() {
    const {args, flags} = this.parse(DevFeature)

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
      cli.action.stop('File not found. Check file path.')
    }
    retrieveYAML = YAML.parse(fs.readFileSync(filePath, 'utf-8'))
    for (let metadataType in retrieveYAML) {
      if (retrieveYAML[metadataType]) {
        for (let metadataName of retrieveYAML[metadataType]) {
          let command = `sfdx force:source:retrieve -m ${metadataType}:${metadataName} -u ${targetusername} --json`
          let cmdOut = JSON.parse(execa.commandSync(command).stdout)
          for (let file of cmdOut.result.inboundFiles) {
            this.log('Retrieved ' + file.filePath)
          }
        }
      } else {
        let command = `sfdx force:source:retrieve -m ${metadataType} -u ${targetusername} --json`
        let cmdOut = JSON.parse(execa.commandSync(command).stdout)
        for (let file of cmdOut.result.inboundFiles) {
          this.log('Retrieved ' + file.filePath)
        }
      }
    }
    cli.action.stop()
  }
}
