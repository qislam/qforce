import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {getFiles, getAbsolutePath, yaml2xml} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
import {updateFeatureYAML} from '../../helper/metadata'
const path = require('path')
const fs = require('fs')
const execa = require('execa')
const YAML = require('yaml')
const sfdx = require('sfdx-node')
const csvjson = require('csvjson')
const xmljs = require('xml-js')
const _ = require('lodash')

export default class DevFeature extends Command {
  static description = 'To retrieve and deploy source based on YAML file.'
  static aliases = ['feature', 'dev:feature']

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.boolean({char: 's', description: 'Start a new feature. Will create YAML file and folder if not already exist.'}),
    buildFromDiff: flags.boolean({description: 'Build metadata components by running a diff.'}),
    buildFromDir: flags.boolean({description: 'Build metadata components based on directory contents.'}),
    buildFromCsv: flags.boolean({description: 'Build metadata components based on a csv file.'}),
    toXml: flags.boolean({description: 'Convert yml file to xml.'}),
    toYaml: flags.boolean({description: 'Convert xml file to yml.'}),
    path: flags.string({char: 'p', description: 'Path to app directory or csv file.'}),
    version: flags.string({description: 'API version to use for SFDX'}),
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
    const targetusername = flags.username || settings.targetusername || sfdxConfig.defaultusername
    const featureYamlPath = settings.featureYamlPath || '.qforce/features'
    const packageBasePath = settings.packageBasePath || 'force-app/main/default'
    const buildFromDirPath = flags.path || packageBasePath

    let featureName = args.featureName.replace('/', '-')
    let featureYAML: looseObject
    let yamlPath = `${featureYamlPath}/${featureName}.yml`

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

    if (flags.buildFromCsv) {
      let csvPath = flags.path || ''
      if (!csvPath) {
        cli.action.stop('File not not provided. Must be relative to current directory')
      }
      if (!fs.existsSync(getAbsolutePath(csvPath))) {
        cli.action.stop('File not found. Check file path. Must be relative to current directory')
      }
      let featureCSV = csvjson.toObject(fs.readFileSync(csvPath, 'utf-8'))
      featureYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))
      for (let metadataRecord of featureCSV) {
        let metadatType = metadataRecord.MetadataType
        let metadatName = metadataRecord.MetadataName
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

    if (flags.buildFromDiff || flags.buildFromDir) {
      if (flags.buildFromDiff && (!args.commit1 || !args.commit2)) {
        cli.action.stop('Provide commits to calculate diff from.')
      } 
      featureYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))
      let filePaths
      if (flags.buildFromDiff) {
        const diffFiles = await execa('git', ['diff', '--name-only', args.commit1, args.commit2])
        filePaths = diffFiles.stdout.split('\n')
      } else if (flags.buildFromDir) {
        filePaths = await getFiles(buildFromDirPath)
        filePaths = filePaths.map(absolutePath => path.relative('', absolutePath))
      } 
      featureYAML = updateFeatureYAML(featureYAML, filePaths, packageBasePath)
      
      for (let key in featureYAML) {
        featureYAML[key] = _.uniqWith(featureYAML[key], _.isEqual)
      }

      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify(featureYAML),
        {encoding: 'utf-8'}
      )
    }

    this.log('Creating xml package file for ' + args.featureName)
    featureYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))
    let apiVersion = `${flags.version || featureYAML.Version || '50'}.0`
    let featureXML = yaml2xml(featureYAML, apiVersion)
    let xmlOptions = {
      spaces: 4, 
      compact: false, 
      declerationKey: 'decleration', 
      attributesKey: 'attributes'
    }
    fs.writeFileSync(
      getAbsolutePath(yamlPath.replace(/yml$/i, 'xml')),
      xmljs.js2xml(featureXML, xmlOptions),
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
    
    if (flags.deploy) {
      sfdx.source.deploy({targetusername: targetusername, 
        manifest: yamlPath.replace(/yml$/i, 'xml'), 
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
