import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {getAbsolutePath} from '../../helper/utility'
const execa = require('execa')
const fs = require('fs')

export default class DevCode extends Command {
  static description = 'describe the command here'
  static aliases = ['code','dev:code']

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'featureBranch'}, {name: 'developBranch'}]

  async run() {
    cli.action.start('Starting to code')
    const {args, flags} = this.parse(DevCode)
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }
    const featureBranch = args.featureBranch
    const developBranch = args.developBranch || settings.developBranch
 
    const mergeBase = await execa('git', ['merge-base', featureBranch, developBranch])
    if (mergeBase.stderr) {
      cli.action.stop(mergeBase.stderr)
      return
    } 
    const baseCommit = mergeBase.stdout
    
    const diff = await execa('git', ['diff', baseCommit, featureBranch])
    if (diff.stderr) {
      cli.action.stop(diff.stderr)
      return
    } 
    const diffContent = diff.stdout + '\n'
    const checkout = await execa('git', ['checkout', featureBranch])
    if (checkout.stderr) {
      this.log(checkout.exitCode)
      cli.action.stop(checkout.stderr)
      //return
    } 
    for(let file of diffContent) {
      let code = await execa('code', [file])
      if (code.stderr) {
        cli.action.stop(code.stderr)
        //return
      } 
    }

  }
}
