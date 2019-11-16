import {expect, test} from '@oclif/test'

describe('dx:describe', () => {
  test
    .stdout()
    .command(['dx:describe'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['dx:describe', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
