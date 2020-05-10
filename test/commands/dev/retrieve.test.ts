import {expect, test} from '@oclif/test'

describe('dev:retrieve', () => {
  test
  .stdout()
  .command(['dev:retrieve'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['dev:retrieve', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
