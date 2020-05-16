import {expect, test} from '@oclif/test'

describe('dev:feature', () => {
  test
  .stdout()
  .command(['dev:feature'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['dev:feature', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
