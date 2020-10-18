import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {getFiles, getAbsolutePath} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
const metaUtil = require('../../helper/metadataUtil')
const path = require('path')
const fs = require('fs')
const execa = require('execa')
const YAML = require('yaml')
const sfdx = require('sfdx-node')
const _ = require('lodash')

export default class DevFeature extends Command {
  static description = 'To retrieve and deploy source based on YAML file.'
  static aliases = ['feature', 'dev:feature']

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.boolean({char: 's', description: 'Start a new feature. Will create YAML file and folder if not already exist.'}),
    buildFromDiff: flags.boolean({char: 'b', description: 'Build metadata components by running a diff.'}),
    listFromDir: flags.boolean({char: 'l', description: 'Build metadata components based on directory contents.'}),
    path: flags.string({char: 'p', description: 'Path to app directory.'}),
    retrieve: flags.boolean({char: 'r', description: 'Retrieve source based on YAML configuration.'}),
    deploy: flags.boolean({char: 'd', description: 'Deploys source already retrieved.'}),
    username: flags.string({char: 'u'}),
  }

  static args = [
    {name: 'featureName', required: true}, 
    {name: 'commit1', required: false},
    {name: 'commit2', required: false}
  ]

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
    const metadataMap = metaUtil.metadataMap
    const metadataRegex = metaUtil.metadataRegex
    const targetusername = flags.username || settings.targetusername || sfdxConfig.defaultusername
    const featureYamlPath = settings.featureYamlPath || '.qforce/features'
    const featureMetaPath = settings.featureMetaPath || '.qforce/features'
    const packageBasePath = settings.packageBasePath || 'force-app/main/default'
    const listFromDirPath = flags.path || packageBasePath

    let featureName = args.featureName.replace('/', '-')
    let featureYAML: looseObject
    let yamlPath = `${featureYamlPath}/${featureName}/${featureName}.yml`

    if (flags.start) {
      if (!fs.existsSync(path.dirname(yamlPath))) {
        fs.mkdirSync(path.dirname(yamlPath), {recursive: true})
      }
      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify({ManualSteps: [{ExampleManualStep: []}]}),
        {encoding: 'utf-8'}
      )
      let command = `code ${yamlPath}`
      execa.commandSync(command)
    }

    if (!fs.existsSync(getAbsolutePath(yamlPath))) {
      cli.action.stop('File not found. Check file path. Remember to start a feature first.')
    }

    if (flags.buildFromDiff || flags.listFromDir) {
      if ( flags.buildFromDiff && (!args.commit1 || !args.commit2)) {
        cli.action.stop('Provide commits to calculate diff from.')
      } 
      featureYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))
      let filePaths
      if (flags.buildFromDiff) {
        const diffFiles = await execa('git', ['diff', '--name-only', args.commit1, args.commit2])
        filePaths = diffFiles.stdout.split('\n')
      } else if (flags.listFromDir) {
        filePaths = await getFiles(listFromDirPath)
        filePaths = filePaths.map(absolutePath => path.relative('', absolutePath))
      } 
      for (let filePath of filePaths) {
        if (flags.buildFromDiff && filePath.indexOf(packageBasePath) == -1) continue
        const filePathParts = filePath.replace(packageBasePath + '/', '').split('/')

        let metadatType = metadataMap.get(filePathParts[0]) || filePathParts[0]
        let metadatName = filePathParts[1]
        // apply regex when available
        if (metadataRegex.get(filePathParts[0])) {
          metadatName = filePathParts[1].replace(metadataRegex.get(filePathParts[0]), '')
        }
        if (metadatType == 'CustomLabels') continue
        if (metadatType == 'CustomObject' && filePathParts.length > 2) {
          if (filePathParts[2] == 'fields') {
            let compName = filePathParts[3].replace(/\.field-meta\.xml$/i, '')
            if (!featureYAML.CustomField) featureYAML.CustomField = []
            featureYAML.CustomField.push(metadatName + '.' + compName)
          }
          if (filePathParts[2] == 'recordTypes') {
            let compName = filePathParts[3].replace(/\.recordType-meta\.xml$/i, '')
            if (!featureYAML.RecordType) featureYAML.RecordType = []
            featureYAML.RecordType.push(metadatName + '.' + compName)
          }
          if (filePathParts[2] == 'compactLayouts') {
            let compName = filePathParts[3].replace(/\.compactLayout-meta\.xml$/i, '')
            if (!featureYAML.CompactLayout) featureYAML.CompactLayout = []
            featureYAML.CompactLayout.push(metadatName + '.' + compName)
          }
          if (filePathParts[2] == 'listViews') {
            let compName = filePathParts[3].replace(/\.listView-meta\.xml$/i, '')
            if (!featureYAML.ListView) featureYAML.ListView = []
            featureYAML.ListView.push(metadatName + '.' + compName)
          }
          if (filePathParts[2] == 'webLinks') {
            let compName = filePathParts[3].replace(/\.webLink-meta\.xml$/i, '')
            if (!featureYAML.WebLink) featureYAML.WebLink = []
            featureYAML.WebLink.push(metadatName + '.' + compName)
          }
        }
        if (metadatType == 'DocumentFolder' && filePathParts.length > 2) {
          let documentName = filePathParts[2].replace(/\..*$/i, '')
          if (!featureYAML.Document) featureYAML.Document = []
          featureYAML.Document.push(metadatName + '/' + documentName)
        }
        if (metadatType == 'EmailFolder' && filePathParts.length > 2) {
          let emailTemplate = filePathParts[2].replace(/\..*$/i, '')
          if (!featureYAML.EmailTemplate) featureYAML.EmailTemplate = []
          featureYAML.EmailTemplate.push(metadatName + '/' + emailTemplate)
        }
        //let metadatName = filePathParts[1].replace(/\..*\.xml$/i, '').replace(/\.(cls|page|asset|trigger)$/i, '')
        if (!featureYAML[metadatType]) featureYAML[metadatType] = []
        
        featureYAML[metadatType].push(metadatName)
      }
      for (let key in featureYAML) {
        featureYAML[key] = _.uniqWith(featureYAML[key], _.isEqual)
      }
      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify(featureYAML),
        {encoding: 'utf-8'}
      )
    }

    const retrievePathBase = `${featureMetaPath}/${featureName}/metadata`
    if (flags.retrieve) {
      cli.action.start('Retrieving feature ' + args.featureName)
      featureYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))
      for (let metadataType in featureYAML) {
        if (metadataType == 'ManualSteps') continue;
        this.log(`Retrieving metadataType: ${metadataType}`);
        if (featureYAML[metadataType]) {
          for (let metadataName of featureYAML[metadataType]) {
            this.log(`Retrieving: ${metadataType}:${metadataName}`);
            await sfdx.source.retrieve({
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
          await sfdx.source.retrieve({
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
