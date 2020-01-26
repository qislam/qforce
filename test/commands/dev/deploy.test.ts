import {expect, test} from '@oclif/test'

describe('dev/deploy', () => {
  test
    .stdout()
    .command(['dev/deploy'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['dev/deploy', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
