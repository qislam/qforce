import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {deleteFolderRecursive, getAbsolutePath} from '../../helper/utility'
import {dxOptions, looseObject} from '../../helper/interfaces'
const sfdx = require('sfdx-node')
const execa = require('execa')
const path = require('path')
const fs = require('fs')

export default class DevDeploy extends Command {
  static description = 'Deploy source components included in a feature branch.'
  static aliases = ['deploy', 'dev:deploy']

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u'}),
    diff: flags.boolean({char: 'd', description: 'Set to true if passing commit hash.'}),
    isCommit: flags.boolean({char: 'c', description: 'Set to true if deploying a single commit.'}),
    lastDeployCommit: flags.string({description: 'Commit hash of the last commit.'}),
  }

  static args = [{name: 'featureBranch'}, {name: 'developBranch'}]

  async run() {
    cli.action.start('Deploying feature ')
    const {args, flags} = this.parse(DevDeploy)
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
    if (fs.existsSync(getAbsolutePath('.qforce/deploy'))) {
      deleteFolderRecursive('.qforce/deploy')
    }
    const featureBranch = args.featureBranch || flags.lastDeployCommit || settings.lastDeployCommit
    const developBranch = args.developBranch || flags.diff? 'HEAD' : settings.developBranch
    const targetusername = flags.username || settings.targetusername || sfdxConfig.defaultusername

    let diff
    if (flags.diff) {
      diff = await execa('git', ['diff', '--name-only', featureBranch, developBranch])
    } else if (flags.isCommit) {
      let commitFiles = 'git diff-tree --no-commit-id --name-only -r ' + featureBranch
      diff = await execa.command(commitFiles)
    } else {
      const mergeBase = await execa('git', ['merge-base', featureBranch, developBranch])
      const baseCommit = mergeBase.stdout
      diff = await execa('git', ['diff', '--name-only', baseCommit, featureBranch])
    }
    const diffFilesList = diff.stdout.split('\n')

    for (let sourceFilePath of diffFilesList) {
      if(!fs.existsSync(sourceFilePath)) continue
      let deployFilePath = '.qforce/deploy/' + sourceFilePath
      if (!fs.existsSync(path.dirname(deployFilePath))) {
        fs.mkdirSync(path.dirname(deployFilePath), {recursive: true});
      }
      fs.copyFileSync(sourceFilePath, deployFilePath)
      if (sourceFilePath.includes('classes/')
          || sourceFilePath.includes('email/')
          || sourceFilePath.includes('pages/')
          || sourceFilePath.includes('scontrols/')
          || sourceFilePath.includes('siteDotComSites/')
          || sourceFilePath.includes('triggers/')
          || sourceFilePath.includes('components/')) {
        if (sourceFilePath.includes('meta.xml')) continue
        fs.copyFileSync(sourceFilePath + '-meta.xml', deployFilePath + '-meta.xml')
      } else if (sourceFilePath.includes('documents/')) {
        fs.copyFileSync(sourceFilePath.replace(/\..*$/, '.document-meta.xml'), 
          deployFilePath.replace(/\..*$/, '.document-meta.xml'))
      } else if (sourceFilePath.includes('lwc/')
          || sourceFilePath.includes('aura/')) {
        fs.readdirSync(path.dirname(sourceFilePath)).forEach((file: string,index: number) => {
          if (fs.lstatSync(path.dirname(sourceFilePath) + '/' + file).isFile()) {
            fs.copyFileSync(path.dirname(sourceFilePath) + '/' + file
            , path.dirname(deployFilePath) + '/' + file)
          }
        })
      }
    }
    let deployCommand = 'sfdx force:source:deploy -p .qforce/deploy -u ' + targetusername
    execa.command(deployCommand).stdout.pipe(process.stdout)
  }
}
