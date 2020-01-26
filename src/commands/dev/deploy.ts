import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {getAbsolutePath} from '../../helper/utility'
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
  }

  static args = [{name: 'featureBranch'}, {name: 'developBranch'}]

  async run() {
    cli.action.start('Deploying feature ')
    const {args, flags} = this.parse(DevDeploy)
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }
    const featureBranch = args.featureBranch
    const developBranch = args.developBranch || settings.developBranch
    
    const mergeBase = await execa('git', ['merge-base', featureBranch, developBranch])
    const baseCommit = mergeBase.stdout
    const diff = await execa('git', ['diff', '--name-only', baseCommit, featureBranch])
    const diffContent = diff.stdout.replace(/\n/g, ',')
    this.log(diffContent)
    let options: dxOptions = {}
    if (flags.username) options.targetusername = flags.username
    options.sourcepath = diffContent
    options.testlevel = 'NoTestRun'
    options.ignorewarnings = true
    options.verbose = true

    let deployResults = await sfdx.source.deploy(options)
    this.log(deployResults)
    //cli.action.stop()
  }
}
