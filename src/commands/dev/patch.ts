import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {getRelativePath} from '../../helper/utility'
const execa = require('execa')
const path = require('path')
const fs = require('fs')

export default class DevPatch extends Command {
  static description = 'describe the command here'
  static aliases = ['patch','dev:patch']

  static flags = {
    help: flags.help({char: 'h'}),
    apply: flags.boolean({char: 'a', 
      description: 'Set to true if want to apply calculated patch to current branch.'}),
    patchPath: flags.string({char: 'p', description: 'Path to save the patch file.'}),
  }

  static args = [{name: 'featureBranch'}, {name: 'developBranch'}]

  async run() {
    cli.action.start('Preparing patch')
    const {args, flags} = this.parse(DevPatch)
    let settings
    if (fs.existsSync(path.join(process.cwd(), '.qforce', 'settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), '.qforce', 'settings.json'))
      )
    }
    const featureBranch = args.featureBranch
    const developBranch = args.developBranch || settings.developBranch
    const patchPathBase = flags.patchPath || settings.patchPath || 'patches'
    if (!fs.existsSync(getRelativePath(patchPathBase))) {
      fs.mkdirSync(getRelativePath(patchPathBase))
    }
    const patchPath = patchPathBase + '/' + featureBranch.replace(/\//g, '-') + '.patch'
    const mergeBase = await execa('git', ['merge-base', featureBranch, developBranch])
    const baseCommit = mergeBase.stdout
    const diff = await execa('git', ['diff', baseCommit, featureBranch])
    const diffContent = diff.stdout + '\n'
    fs.writeFileSync(getRelativePath(patchPath), diffContent, {encoding: 'utf-8'})
    if (flags.apply) {
      await execa('git', 
        ['apply', '--reject', '--whitespace=fix', getRelativePath(patchPath)]
      )
    } 
    cli.action.stop()
  }
}
