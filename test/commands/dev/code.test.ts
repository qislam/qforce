import {expect, test} from '@oclif/test'

describe('dev:code', () => {
  test
    .stdout()
    .command(['dev:code'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['dev:code', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
