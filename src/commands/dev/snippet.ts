import {Command, flags} from '@oclif/command'
import {dxOptions, looseObject} from '../../helper/interfaces'
import {getAbsolutePath} from '../../helper/utility'
const path = require('path')
const fs = require('fs')

export default class DevSnippet extends Command {
  static description = 'Generates VS Code snippets file based on sObject definitions'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(DevSnippet)
    let qforceSnippets = {}
    if (!fs.existsSync(getAbsolutePath('.qforce/definitions/'))) {
      this.log('No object definitions found. First run qforce dev:describe command.')
    }
    if (!fs.existsSync(getAbsolutePath('.vscode'))) {
      fs.mkdirSync(getAbsolutePath('.vscode'), {recursive: true})
    }
    if (fs.existsSync(getAbsolutePath('.vscode/qforce.code-snippets'))) {
      qforceSnippets = JSON.parse(fs.readFileSync(getAbsolutePath('.vscode/qforce.code-snippets')))
    }
  }
}
