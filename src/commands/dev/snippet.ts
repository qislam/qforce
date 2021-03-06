import {Command, flags} from '@oclif/command'
import {dxOptions, looseObject} from '../../helper/interfaces'
import {getAbsolutePath} from '../../helper/utility'
import {migrateSnippets} from '../../helper/snippets'
const path = require('path')
const fs = require('fs')
const _ = require('lodash')

export default class DevSnippet extends Command {
  static description = 'Generates VS Code snippets to help using qforce.'
  static aliases = ['snippet', 'dev:snippet']

  static examples = [
    '$ qforce snippet --init //Creates a snippets file for saving qforce related snippets.',
    '$ qforce snippet -q -a q_1 //Saves contents of queryFilePath into a snippet named q_1.',
    '$ qforce snippet -q -e e_1 //Saves contents of exeFilePath into a snippet named e_1.',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    init: flags.boolean({char: 'i', description: 'To initialize snippet file.'}),
    query: flags.boolean({char: 'q', description: 'Create alias for query at default query path.'}),
    exe: flags.boolean({char: 'e', description: 'Create alias for anonymous apex at default exe path.'}),
    alias: flags.string({char:'a', description: 'Alias for the snippet'}),
    path: flags.string({char: 'p', description: 'Path to file that needs to be converted to snippet. Required if query/exe flags not passed'})
  }

  static args = []

  async run() {
    const {args, flags} = this.parse(DevSnippet)
    let qforceSnippets: looseObject = {}
    let settings
    if (fs.existsSync(getAbsolutePath('.qforce/settings.json'))) {
      settings = JSON.parse(
        fs.readFileSync(getAbsolutePath('.qforce/settings.json'))
      )
    }

    if (!fs.existsSync(getAbsolutePath('.vscode'))) {
      fs.mkdirSync(getAbsolutePath('.vscode'), {recursive: true})
    }
    if (fs.existsSync(getAbsolutePath('.vscode/qforce.code-snippets'))) {
      qforceSnippets = JSON.parse(fs.readFileSync(getAbsolutePath('.vscode/qforce.code-snippets')))
    }
    if (!qforceSnippets) {
      qforceSnippets = migrateSnippets
    } else {
      for (let key in migrateSnippets) {
        qforceSnippets[key] = migrateSnippets[key]
      }
    }
    if (!flags.init && !flags.alias) {
      this.log('Must provide alias to proceed.')
      return
    }
    let filePath = flags.path || ''
    if (flags.query) {
      filePath = settings.queryFilePath
    } else if (flags.exe) {
      filePath = settings.exeFilePath
    } 
    if (filePath && fs.existsSync(getAbsolutePath(filePath))) {
      let content = fs.readFileSync(getAbsolutePath(filePath), 'utf8')
      if (content) content += '$0'
      let snippet: looseObject = {}
      let key = flags.alias || 'q1'
      let body = content.split('\n')
      _.remove(body, (
        line: string) => {
          return line.startsWith('//') || line.trim() === ''
        }
      )
      snippet.prefix = key
      snippet.body = body
      qforceSnippets[key] = snippet
    } else if (filePath) {
      this.log('Path provided lead no where...')
    }

    fs.writeFileSync(
      getAbsolutePath('.vscode/qforce.code-snippets'), 
      JSON.stringify(qforceSnippets, null, 4),
      {encoding: 'utf-8'}
    )
  }
}
