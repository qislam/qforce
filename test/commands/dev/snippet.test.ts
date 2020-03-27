import {expect, test} from '@oclif/test'

describe('dev:snippet', () => {
  test
    .stdout()
    .command(['dev:snippet'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['dev:snippet', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
