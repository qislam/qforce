import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {deleteFolderRecursive, getAbsolutePath} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
const path = require('path')
const fs = require('fs')
const execa = require('execa')
const YAML = require('yaml')
const sfdx = require('sfdx-node')
const _ = require('lodash')

export default class DevRelease extends Command {
  static description = 'describe the command here'
  static aliases = ['release', 'dev:release']

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.boolean({char: 's', description: 'Start a new release. Will create YAML file and folder if not already exist.'}),
    build: flags.boolean({char: 'b', description: 'To recalculate components based on features listed.'}),
    retrieve: flags.boolean({char: 'r', description: 'Retrieve source based on YAML configuration.'}),
    deploy: flags.boolean({char: 'd', description: 'Deploys source already retrieved.'}), 
    username: flags.string({char: 'u'}),
  }

  static args = [{name: 'releaseName'}]

  async run() {
    const {args, flags} = this.parse(DevRelease)
    cli.action.start('Working on release')
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

    let releaseName = args.releaseName.replace('/', '-')

    if (flags.start) {
      let yamlPath = `.qforce/releases/${releaseName}/${releaseName}.yml`
      if (!fs.existsSync(path.dirname(yamlPath))) {
        fs.mkdirSync(path.dirname(yamlPath), {recursive: true})
      }
      let command = `code .qforce/releases/${releaseName}/${releaseName}.yml`
      execa.commandSync(command)
    }

    let yamlPath = `.qforce/releases/${releaseName}/${releaseName}.yml`
    if (!fs.existsSync(getAbsolutePath(yamlPath))) {
      cli.action.stop('File not found. Check file path. Remember to start a feature first.')
    }
    const retrieveYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))
    //cli.action.start(retrieveYAML.features)
    const retrievePathBase = `.qforce/releases/${releaseName}/metadata`

    if (flags.build) {
      cli.action.start('Building release components.')
      retrieveYAML.components = {}
      for (let feature of retrieveYAML.features) {
        //cli.action.start('processing ' + feature)
        let featureName = feature.replace('/', '-')
        let featurePath = `.qforce/features/${featureName}/${featureName}.yml`
        if(fs.existsSync(getAbsolutePath(featurePath))) {
          //cli.action.start('processing path ' + featurePath)
          let featureYaml = YAML.parse(fs.readFileSync(featurePath, 'utf-8'))
          for (let key in featureYaml) {
            if (!featureYaml[key]) featureYaml[key] = []
            if (!retrieveYAML.components[key]) retrieveYAML.components[key] = []
            retrieveYAML.components[key] = _.union(retrieveYAML.components[key], featureYaml[key])
          }
          //_.assign(retrieveYAML.components, featureYaml)
        }
      }
      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify(retrieveYAML),
        {encoding: 'utf-8'}
      )
      cli.action.stop()
    }

    if (flags.retrieve) {
      cli.action.start('Retrieving release ' + args.releaseName)
      let components = retrieveYAML.components
      if (!components) cli.action.stop('No components defined. Execute qforce release --build releaseName')
      for (let metadataType in components) {
        if (components[metadataType]) {
          for (let metadataName of components[metadataType]) {
            sfdx.source.retrieve({
              metadata: `${metadataType}:${metadataName}`,
              targetusername: targetusername,
              _quiet: false,
              _rejectOnError: true
            }).then(
              (result: any) => {
                this.log(result)
                for (let file of result.inboundFiles) {
                  let retrievePath = `${retrievePathBase}/${file.filePath}` 
                  if (!fs.existsSync(path.dirname(retrievePath))) {
                    fs.mkdirSync(path.dirname(retrievePath), {recursive: true})
                  }
                  fs.copyFileSync(file.filePath, retrievePath)
                  this.log('Retrieved ' + file.filePath)
                }
              }
            ).catch(
              (error: any) => {
                this.log(error)
              }
            )
          }
        } else {
          sfdx.source.retrieve({
            metadata: metadataType,
            targetusername: targetusername,
            _quiet: false,
            _rejectOnError: true
          }).then(
            (result: any) => {
              this.log(result)
              for (let file of result.inboundFiles) {
                let retrievePath = `${retrievePathBase}/${file.filePath}` 
                if (!fs.existsSync(path.dirname(retrievePath))) {
                  fs.mkdirSync(path.dirname(retrievePath), {recursive: true})
                }
                fs.copyFileSync(file.filePath, retrievePath)
                this.log('Retrieved ' + file.filePath)
              }
            }
          ).catch(
            (error: any) => {
              this.log(error)
            }
          )
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
