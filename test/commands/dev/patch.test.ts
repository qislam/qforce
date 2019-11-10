import {expect, test} from '@oclif/test'

describe('dev:patch', () => {
  test
    .stdout()
    .command(['dev:patch'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['dev:patch', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
