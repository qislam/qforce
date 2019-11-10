qforce
=

Commands to help with salesforce development process. This is still very experimental so expect things to change a lot.

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
qforce/0.0.6 darwin-x64 node-v10.13.0
$ qforce --help [COMMAND]
USAGE
  $ qforce COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qforce dev:migrate`](#qforce-devmigrate)
* [`qforce dev:patch [FILE]`](#qforce-devpatch-file)
* [`qforce dx:exe`](#qforce-dxexe)
* [`qforce dx:ol`](#qforce-dxol)
* [`qforce dx:open`](#qforce-dxopen)
* [`qforce dx:query`](#qforce-dxquery)
* [`qforce help [COMMAND]`](#qforce-help-command)

## `qforce dev:migrate`

Migrate data from one org to another based on a migration plan.

```
USAGE
  $ qforce dev:migrate

OPTIONS
  -d, --destination=destination  destination org username or alias
  -f, --file=file                Path of migration plan file. Must be relative to cwd and in unix format.
  -h, --help                     show CLI help
  -s, --source=source            source org username or alias

ALIASES
  $ qforce migrate
  $ qforce m
```

_See code: [src/commands/dev/migrate.ts](https://github.com/qislam/qforce/blob/v0.0.6/src/commands/dev/migrate.ts)_

## `qforce dev:patch [FILE]`

describe the command here

```
USAGE
  $ qforce dev:patch [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/dev/patch.ts](https://github.com/qislam/qforce/blob/v0.0.6/src/commands/dev/patch.ts)_

## `qforce dx:exe`

Execute anonymous apex.

```
USAGE
  $ qforce dx:exe

OPTIONS
  -f, --file=file          Relative path of apex file in unix format.
  -h, --help               show CLI help
  -r, --result=result      Relative path to save results.
  -u, --username=username

EXAMPLE
  $ q dx:exe
```

_See code: [src/commands/dx/exe.ts](https://github.com/qislam/qforce/blob/v0.0.6/src/commands/dx/exe.ts)_

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

_See code: [src/commands/dx/ol.ts](https://github.com/qislam/qforce/blob/v0.0.6/src/commands/dx/ol.ts)_

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

_See code: [src/commands/dx/open.ts](https://github.com/qislam/qforce/blob/v0.0.6/src/commands/dx/open.ts)_

## `qforce dx:query`

Execute anonymous apex.

```
USAGE
  $ qforce dx:query

OPTIONS
  -f, --file=file          Relative path of query file in unix format.
  -h, --help               show CLI help
  -q, --query=query        SOQL query as string.
  -r, --result=result      Relative path to save results of query.
  -u, --username=username

ALIASES
  $ qforce query
  $ qforce q

EXAMPLE
  $ q dx:query
```

_See code: [src/commands/dx/query.ts](https://github.com/qislam/qforce/blob/v0.0.6/src/commands/dx/query.ts)_

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
