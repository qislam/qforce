import {Command, flags} from '@oclif/command'
const debug = require('debug')('qforce')
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
    debug('args: ' + JSON.stringify(args, null, 4))
    debug('flags: ' + JSON.stringify(flags, null, 4))

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
    debug('targetusername: ' + targetusername)

    const featureYamlPath = settings.featureYamlPath || '.qforce/features'
    debug('featureYamlPath: ' + featureYamlPath)

    const packageBasePath = settings.packageBasePath || 'force-app/main/default'
    debug('packageBasePath: ' + packageBasePath)

    const buildFromDirPath = flags.path || packageBasePath
    debug('buildFromDirPath: ' + buildFromDirPath)

    let featureName = args.featureName.replace('/', '-')
    let featureYAML: looseObject
    let yamlPath = `${featureYamlPath}/${featureName}.yml`
    debug('Calculated yamlPath: ' + yamlPath)

    if (flags.start) {
      if (!fs.existsSync(path.dirname(yamlPath))) {
        debug('Creating dir at yamlPath: ' + yamlPath)
        fs.mkdirSync(path.dirname(yamlPath), {recursive: true})
      }
      fs.writeFileSync(
        getAbsolutePath(yamlPath),
        YAML.stringify({CustomObject: ['Account']}),
        {encoding: 'utf-8'}
      )
      debug('Opening yaml file in VS Code')
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
      debug('featureCSV first record: ' + JSON.stringify(featureCSV[0], null, 4))

      featureYAML = YAML.parse(fs.readFileSync(yamlPath, 'utf-8'))

      for (let metadataRecord of featureCSV) {
        debug('metadataRecord: ' + JSON.stringify(metadataRecord, null, 4))
        let metadatType = metadataRecord.MetadataType
        let metadatName = metadataRecord.MetadataName
        if (!featureYAML[metadatType]) featureYAML[metadatType] = []
        featureYAML[metadatType].push(metadatName)
        debug('featureYAML: ' + JSON.stringify(featureYAML, null, 4))
      }

      for (let key in featureYAML) {
        featureYAML[key] = _.uniqWith(featureYAML[key], _.isEqual)
        if (key == 'ManualSteps' || key == 'Version') continue
        featureYAML[key].sort()
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
        debug('diffFiles: \n' + JSON.stringify(diffFiles, null, 4))
        filePaths = diffFiles.stdout.split('\n')
        debug('filePaths: \n' + JSON.stringify(filePaths, null, 4))
      } else if (flags.buildFromDir) {
        filePaths = await getFiles(buildFromDirPath)
        filePaths = filePaths.map(absolutePath => path.relative('', absolutePath))
      } 
      featureYAML = updateFeatureYAML(featureYAML, filePaths, packageBasePath)
      
      for (let key in featureYAML) {
        featureYAML[key] = _.uniqWith(featureYAML[key], _.isEqual)
        if (key == 'ManualSteps' || key == 'Version') continue
        featureYAML[key].sort()
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
