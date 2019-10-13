q
=

Commands by Qamar

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/q.svg)](https://npmjs.org/package/q)
[![Downloads/week](https://img.shields.io/npm/dw/q.svg)](https://npmjs.org/package/q)
[![License](https://img.shields.io/npm/l/q.svg)](https://github.com/qislam/q/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g q
$ q COMMAND
running command...
$ q (-v|--version|version)
q/0.0.0 darwin-x64 node-v10.13.0
$ q --help [COMMAND]
USAGE
  $ q COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`q dx`](#q-dx)
* [`q hello [FILE]`](#q-hello-file)
* [`q help [COMMAND]`](#q-help-command)

## `q dx`

Shortcuts for commonly used sfdx commands

```
USAGE
  $ q dx

OPTIONS
  -h, --help     show CLI help
  -l, --orglist

EXAMPLE
  $ q dx -l
```

_See code: [src/commands/dx.ts](https://github.com/qislam/q/blob/v0.0.0/src/commands/dx.ts)_

## `q hello [FILE]`

describe the command here

```
USAGE
  $ q hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ q hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/qislam/q/blob/v0.0.0/src/commands/hello.ts)_

## `q help [COMMAND]`

display help for q

```
USAGE
  $ q help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_
<!-- commandsstop -->
