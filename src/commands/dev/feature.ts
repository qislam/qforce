import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {deleteFolderRecursive, getAbsolutePath} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
const path = require('path')
const fs = require('fs')
const execa = require('execa')
const YAML = require('yaml')
const sfdx = require('sfdx-node')

export default class DevFeature extends Command {
  static description = 'To retrieve and deploy source based on YAML file.'
  static aliases = ['feature', 'dev:feature']

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.boolean({char: 's', description: 'Start a new feature. Will create YAML file and folder if not already exist.'}),
    retrieve: flags.boolean({char: 'r', description: 'Retrieve source based on YAML configuration.'}),
    deploy: flags.boolean({char: 'd', description: 'Deploys source already retrieved.'}),
    username: flags.string({char: 'u'}),
  }

  static args = [{name: 'featureName', required: true}]

  async run() {
    const {args, flags} = this.parse(DevFeature)

    cli.action.start('started processing feature ' + args.featureName)

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

    let featureName = args.featureName.replace('/', '-')

    if (flags.start) {
      let yamlPath = `.qforce/features/${featureName}/${featureName}.yml`
      if (!fs.existsSync(path.dirname(yamlPath))) {
        fs.mkdirSync(path.dirname(yamlPath), {recursive: true})
      }
      let command = `code .qforce/features/${featureName}/${featureName}.yml`
      execa.commandSync(command)
    }

    const retrievePathBase = `.qforce/features/${featureName}/metadata`
    if (flags.retrieve) {
      cli.action.start('Retrieving feature ' + args.featureName)
      let retrieveYAML: looseObject
      let yamlPath = `.qforce/features/${featureName}/${featureName}.yml`
      if (!fs.existsSync(getAbsolutePath(yamlPath))) {
        cli.action.stop('File not found. Check file path. Remember to start a feature first.')
      }
      retrieveYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))

      for (let metadataType in retrieveYAML) {
        if (retrieveYAML[metadataType]) {
          for (let metadataName of retrieveYAML[metadataType]) {
            let command = `sfdx force:source:retrieve -m "${metadataType}:${metadataName}" -u ${targetusername} --json`
            let cmdOut = JSON.parse(execa.commandSync(command).stdout)
            if (!cmdOut.result) {
              this.log(`Metadata not retrieved - "${metadataType}:${metadataName}"`)
              continue
            }
            for (let file of cmdOut.result.inboundFiles) {
              let retrievePath = `${retrievePathBase}/${file.filePath}` 
              if (!fs.existsSync(path.dirname(retrievePath))) {
                fs.mkdirSync(path.dirname(retrievePath), {recursive: true})
              }
              fs.copyFileSync(file.filePath, retrievePath)
              this.log('Retrieved ' + file.filePath)
            }
          }
        } else {
          let command = `sfdx force:source:retrieve -m ${metadataType} -u ${targetusername} --json`
          let cmdOut = JSON.parse(execa.commandSync(command).stdout)
          for (let file of cmdOut.result.inboundFiles) {
            let retrievePath = `${retrievePathBase}/${file.filePath}` 
            if (!fs.existsSync(path.dirname(retrievePath))) {
              fs.mkdirSync(path.dirname(retrievePath), {recursive: true})
            }
            fs.copyFileSync(file.filePath, retrievePath)
            this.log('Retrieved ' + file.filePath)
          }
        }
      }
    }
    
    if (flags.deploy) {
      sfdx.source.deploy({targetusername: targetusername, 
        sourcepath: retrievePathBase, 
        json: true, 
        _rejectOnError: true})
      .then(
        (result: any) => {
          cli.action.stop(JSON.stringify(result, null, 4))
        }
      ).catch(
        (error: any) => {
          cli.action.stop(error[0].message)
        }
      )
    }
  }
}
