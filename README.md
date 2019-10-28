qforce
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
$ npm install -g qforce
$ qforce COMMAND
running command...
$ qforce (-v|--version|version)
qforce/0.0.3 darwin-x64 node-v10.13.0
$ qforce --help [COMMAND]
USAGE
  $ qforce COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
- [qforce](#qforce)
- [Usage](#usage)
- [Commands](#commands)
  - [`qforce dev:migrate`](#qforce-devmigrate)
  - [`qforce dx:exe`](#qforce-dxexe)
  - [`qforce dx:ol`](#qforce-dxol)
  - [`qforce dx:open`](#qforce-dxopen)
  - [`qforce dx:query`](#qforce-dxquery)
  - [`qforce hello [FILE]`](#qforce-hello-file)
  - [`qforce help [COMMAND]`](#qforce-help-command)

## `qforce dev:migrate`

Migrate data from one org to another based on a migration plan.

```
USAGE
  $ qforce dev:migrate

OPTIONS
  -d, --destination=destination  destination org username or alias
  -h, --help                     show CLI help
  -s, --source=source            (required) source org username or alias
```

_See code: [src/commands/dev/migrate.ts](https://github.com/qislam/qforce/blob/v0.0.1/src/commands/dev/migrate.ts)_

## `qforce dx:exe`

Execute anonymous apex.

```
USAGE
  $ qforce dx:exe

OPTIONS
  -h, --help               show CLI help
  -u, --username=username
  -v, --verbose

EXAMPLE
  $ q dx:exe
```

_See code: [src/commands/dx/exe.ts](https://github.com/qislam/qforce/blob/v0.0.1/src/commands/dx/exe.ts)_

## `qforce dx:ol`

List of available orgs.

```
USAGE
  $ qforce dx:ol

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

EXAMPLE
  $ q dx:ol
```

_See code: [src/commands/dx/ol.ts](https://github.com/qislam/qforce/blob/v0.0.1/src/commands/dx/ol.ts)_

## `qforce dx:open`

Open an org.

```
USAGE
  $ qforce dx:open

OPTIONS
  -h, --help               show CLI help
  -p, --path=path
  -u, --username=username

EXAMPLE
  $ q dx:open -u uat
```

_See code: [src/commands/dx/open.ts](https://github.com/qislam/qforce/blob/v0.0.1/src/commands/dx/open.ts)_

## `qforce dx:query`

Execute anonymous apex.

```
USAGE
  $ qforce dx:query

OPTIONS
  -h, --help               show CLI help
  -u, --username=username
  -v, --verbose

EXAMPLE
  $ q dx:query
```

_See code: [src/commands/dx/query.ts](https://github.com/qislam/qforce/blob/v0.0.1/src/commands/dx/query.ts)_

## `qforce hello [FILE]`

describe the command here

```
USAGE
  $ qforce hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ q hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/qislam/qforce/blob/v0.0.1/src/commands/hello.ts)_

## `qforce help [COMMAND]`

display help for qforce

```
USAGE
  $ qforce help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_
<!-- commandsstop -->
