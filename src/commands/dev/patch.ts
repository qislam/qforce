import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {getAbsolutePath} from '../../helper/utility'
const execa = require('execa')
const path = require('path')
const fs = require('fs')

export default class DevPatch extends Command {
  static description = 'Prepare and apply a patch to current branch from another branch.'
  static aliases = ['patch','dev:patch']

  static flags = {
    help: flags.help({char: 'h'}),
    apply: flags.boolean({char: 'a', 
      description: 'Set to true if want to apply calculated patch to current branch.'}),
    patchPath: flags.string({char: 'p', description: 'Path to save the patch file.'}),
    syncUp: flags.boolean({char: 's', description: 'Set to true if need to retrieve'}),
  }

  static args = [{name: 'featureBranch'}, {name: 'developBranch'}]

  async run() {
    cli.action.start('Preparing patch')
    const {args, flags} = this.parse(DevPatch)
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }
    const featureBranch = args.featureBranch
    const developBranch = args.developBranch || settings.developBranch
    const patchPathBase = flags.patchPath || settings.patchPath || 'patches'
    if (!fs.existsSync(getAbsolutePath(patchPathBase))) {
      fs.mkdirSync(getAbsolutePath(patchPathBase))
    }
    const patchPath = patchPathBase + '/' + featureBranch.replace(/\//g, '-') + '.patch'
    const mergeBase = await execa('git', ['merge-base', featureBranch, developBranch])
    const baseCommit = mergeBase.stdout
    
    let diff
    if (flags.syncUp) {
      const diffFiles = await execa('git', ['diff', '--name-only', baseCommit, featureBranch])
      const filePaths = diffFiles.stdout.replace(/\n/g, ' ')
      const commandString = 'git diff ' + baseCommit + ' ' + developBranch + ' ' + filePaths
      diff = await execa.command(commandString)
    } else {
      diff = await execa('git', ['diff', baseCommit, featureBranch])
    }
    
    const diffContent = diff.stdout + '\n'
    fs.writeFileSync(getAbsolutePath(patchPath), diffContent, {encoding: 'utf-8'})
    if (flags.apply) {
      await execa('git', 
        ['apply', '--reject', '--whitespace=fix', getAbsolutePath(patchPath)]

      )
    } 
    cli.action.stop()
  }
}
