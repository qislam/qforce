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
    apply: flags.boolean({char: 'a'}),
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
    const patchPath = settings.patchPath + '/' + featureBranch.replace(/\//g, '-') + '.patch'
    
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
