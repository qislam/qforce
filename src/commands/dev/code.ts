import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import {getAbsolutePath} from '../../helper/utility'
const execa = require('execa')
const fs = require('fs')

export default class DevCode extends Command {
  static description = 'Open all files committed in a branch in VS Code'
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
    
    execa('git', ['checkout', featureBranch]
    ).catch(
      (error: any) => this.log(error)
    ).then(
      (result:any) => {
        return execa('git', ['merge-base', featureBranch, developBranch])
      }
    ).catch(
      (error:any) => this.log(error)
    ).then(
      (result:any) => {
        return execa('git', ['diff', '--name-only', result.stdout, featureBranch])
      }
    ).then(
      (result:any) => {
        for (let file of result.stdout.split('\n')) {
          execa.sync('code', [file])
        }
        cli.action.stop()
      }
    ).catch(
      (error: any) => {
        cli.action.stop(error)
      }
    )
  }
}
