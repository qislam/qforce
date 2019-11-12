import {expect, test} from '@oclif/test'

describe('dev:config', () => {
  test
    .stdout()
    .command(['dev:config'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['dev:config', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
