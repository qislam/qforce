import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {deleteFolderRecursive, getAbsolutePath, yaml2xml} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
const path = require('path')
const fs = require('fs')
const execa = require('execa')
const YAML = require('yaml')
const sfdx = require('sfdx-node')
const xmljs = require('xml-js')
const _ = require('lodash')

export default class DevRelease extends Command {
  static description = 'To manage yml based release build, retrieve and deploy.'
  static aliases = ['release', 'dev:release']

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.boolean({char: 's', description: 'Start a new release. Will create YAML file and folder if not already exist.'}),
    build: flags.boolean({char: 'b', description: 'To recalculate components based on features listed.'}),
    retrieve: flags.boolean({char: 'r', description: 'Retrieve source based on YAML configuration.'}),
    deploy: flags.boolean({char: 'd', description: 'Deploys source already retrieved.'}), 
    username: flags.string({char: 'u'}),
    version: flags.string({description: 'API version to use for SFDX'}),
    addFeature: flags.string({char: 'a', description: 'Adds one or more features to the release specified.'}),
    removeFeature: flags.string({char: 'R', description: 'Removes one or more features from the release specified.'}),
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
    const releaseYamlPath = settings.releaseYamlPath || '.qforce/releases'
    const featureYamlPath = settings.featureYamlPath || '.qforce/features'

    let releaseName = args.releaseName.replace('/', '-')

    if (flags.start) {
      let yamlPath = `${releaseYamlPath}/${releaseName}.yml`
      if (!fs.existsSync(path.dirname(yamlPath))) {
        fs.mkdirSync(path.dirname(yamlPath), {recursive: true})
      }
      if (!fs.existsSync(yamlPath)) {
        fs.writeFileSync(
          getAbsolutePath(yamlPath),
          YAML.stringify({features: [], manualSteps: [], components: []}),
          {encoding: 'utf-8'}
        )
      }
      let command = `code ${releaseYamlPath}/${releaseName}/${releaseName}.yml`
      execa.commandSync(command)
    }

    let yamlPath = `${releaseYamlPath}/${releaseName}.yml`
    if (!fs.existsSync(getAbsolutePath(yamlPath))) {
      cli.action.stop('File not found. Check file path. Remember to start a feature first.')
    }
    const releaseYaml = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))

    if (flags.addFeature) {
      cli.action.start('Adding feature to the release')
      let featureList = flags.addFeature.split(',')
      releaseYaml.features = _.union(releaseYaml.features, featureList)
      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify(releaseYaml),
        {encoding: 'utf-8'}
      )
      cli.action.stop()
    }

    if (flags.removeFeature) {
      cli.action.start('Adding feature to the release')
      let featureList = flags.removeFeature.split(',')
      releaseYaml.features = _.without(releaseYaml.features, ...featureList)
      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify(releaseYaml),
        {encoding: 'utf-8'}
      )
      cli.action.stop()
    }

    if (flags.build || flags.addFeature || flags.removeFeature) {
      cli.action.start('Building release components.')
      releaseYaml.components = {}
      for (let feature of releaseYaml.features) {
        //cli.action.start('processing ' + feature)
        let featureName = feature.replace('/', '-')
        let featurePath = `${featureYamlPath}/${featureName}/${featureName}.yml`
        if(fs.existsSync(getAbsolutePath(featurePath))) {
          //cli.action.start('processing path ' + featurePath)
          let featureYaml = YAML.parse(fs.readFileSync(featurePath, 'utf-8'))
          for (let key in featureYaml) {
            if (key == 'ManualSteps') {
              if (!releaseYaml.manualSteps) releaseYaml.manualSteps = []
              releaseYaml.manualSteps = _.union(releaseYaml.manualSteps, featureYaml[key])
              releaseYaml.manualSteps = _.uniqWith(releaseYaml.manualSteps, _.isEqual)
            } else {
              if (!featureYaml[key]) featureYaml[key] = []
              if (!releaseYaml.components[key]) releaseYaml.components[key] = []
              releaseYaml.components[key] = _.union(releaseYaml.components[key], featureYaml[key])
            }
          }
        } else {
          cli.action.stop(`${feature} not found at path ${featurePath}`)
        }
      }
      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify(releaseYaml),
        {encoding: 'utf-8'}
      )
      cli.action.stop()
    }
    let apiVersion = `${flags.version || releaseYaml.Version || '50'}.0`
    let releaseXML = yaml2xml(releaseYaml.components, '50.0')
    let xmlOptions = {
      spaces: 4, 
      compact: false, 
      declerationKey: 'decleration', 
      attributesKey: 'attributes'
    }
    fs.writeFileSync(
      getAbsolutePath(yamlPath.replace(/yml$/i, 'xml')),
      xmljs.js2xml(releaseXML, xmlOptions),
      {encoding: 'utf-8'}
    )

    if (flags.retrieve) {
      cli.action.start('Retrieving package for ' + args.featureName)
      await sfdx.source.retrieve({
        manifest: yamlPath.replace(/yml$/i, 'xml'),
        targetusername: targetusername,
        _quiet: false,
        _rejectOnError: true
      }).then(
        (result: any) => {
          this.log(result)
        }
      ).catch(
        (error: any) => {
          this.log(error)
        }
      )
    }

    if (flags.retrieve && false) {
      cli.action.start('Retrieving release ' + args.releaseName)
      let components = releaseYaml.components
      if (!components) cli.action.stop('No components defined. Execute qforce release --build releaseName')
      for (let metadataType in components) {
        if (metadataType == 'ManualStep') continue;
        this.log(`Retrieving metadatType: ${metadataType}`);
        if (components[metadataType]) {
          for (let metadataName of components[metadataType]) {
            this.log(`Retrieving: ${metadataType}:${metadataName}`);
            await sfdx.source.retrieve({
              metadata: `${metadataType}:${metadataName}`,
              targetusername: targetusername,
              json: true,
              _quiet: false,
              _rejectOnError: true
            }).then(
              (result: any) => {
                if (!result.inboundFiles.length) {
                  this.log(`\n\nCould not retrieve ${metadataType}:${metadataName}\n\n`)
                }
                for (let file of result.inboundFiles) {
                  let retrievePath = `${retrievePathBase}/${file.filePath}` 
                  if (!fs.existsSync(path.dirname(retrievePath))) {
                    fs.mkdirSync(path.dirname(retrievePath), {recursive: true})
                  }
                  fs.copyFileSync(file.filePath, retrievePath)
                  //this.log('Retrieved ' + file.filePath)
                }
              }
            ).catch(
              (error: any) => {
                this.log(`Could Not retrieve ${metadataType}:${metadataName}`)
                //this.log(error)
              }
            )
          }
        } else {
          await sfdx.source.retrieve({
            metadata: metadataType,
            targetusername: targetusername,
            json: true,
            _quiet: false,
            _rejectOnError: true
          }).then(
            (result: any) => {
              if (!result.inboundFiles.length) {
                this.log(`\n\nCould not retrieve ${metadataType}\n\n`)
              }
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
        manifest: yamlPath.replace(/yml$/i, 'xml'),  
        json: true, 
        _rejectOnError: true,
        _quiet: true})
      .then(
        (result: any) => {
          cli.action.stop(JSON.stringify(result, null, 4))
        }
      ).catch(
        (error: any) => {
          cli.action.stop(JSON.stringify(error, null, 4))
        }
      )
    }
  }
}
