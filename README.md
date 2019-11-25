qforce
=

Commands to help with salesforce development process. This is still very experimental so expect things to change a lot. More detailed documentation is available [here](https://qislam.github.io/qforce)

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
qforce/0.2.0 darwin-x64 node-v10.13.0
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
  - [`qforce dev:config [FILE]`](#qforce-devconfig-file)
  - [`qforce dev:migrate`](#qforce-devmigrate)
  - [`qforce dev:patch [FEATUREBRANCH] [DEVELOPBRANCH]`](#qforce-devpatch-featurebranch-developbranch)
  - [`qforce dx:describe`](#qforce-dxdescribe)
  - [`qforce dx:exe`](#qforce-dxexe)
  - [`qforce dx:ol`](#qforce-dxol)
  - [`qforce dx:open`](#qforce-dxopen)
  - [`qforce dx:query`](#qforce-dxquery)
  - [`qforce help [COMMAND]`](#qforce-help-command)

## `qforce dev:config [FILE]`

describe the command here

```
USAGE
  $ qforce dev:config [FILE]

OPTIONS
  -g, --global                             To set or retrieve setting from global.
  -h, --help                               show CLI help
  -u, --targetusername=targetusername      Set or retrieve targetusername.
  --bulkStatusInterval=bulkStatusInterval  Interval in milliseconds for polling bluk job status.
  --bulkStatusRetries=bulkStatusRetries    Number of retries to poll status of bulk job.
  --exeFilePath=exeFilePath                Path to file to execute for exe command.
  --exeResultsPath=exeResultsPath          Path to save log of exe command execution.
  --init                                   Initiate qforce settings.
  --queryFilePath=queryFilePath            Path of query file to use with query command.
  --queryResultsPath=queryResultsPath      Path to save results of query command.

ALIASES
  $ qforce config
  $ qforce dev:config
```

_See code: [src/commands/dev/config.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dev/config.ts)_

## `qforce dev:migrate`

Migrate data from one org to another based on a migration plan.

```
USAGE
  $ qforce dev:migrate

OPTIONS
  -d, --destination=destination  destination org username or alias
  -f, --file=file                Path of migration plan file. Must be relative to cwd and in unix format.
  -h, --help                     show CLI help
  -n, --name=name                Name of the step to execute.
  -s, --source=source            source org username or alias.
  --sample                       Copy sample migration plan files to current directory.

ALIASES
  $ qforce migrate
  $ qforce m
```

_See code: [src/commands/dev/migrate.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dev/migrate.ts)_

## `qforce dev:patch [FEATUREBRANCH] [DEVELOPBRANCH]`

describe the command here

```
USAGE
  $ qforce dev:patch [FEATUREBRANCH] [DEVELOPBRANCH]

OPTIONS
  -a, --apply                Set to true if want to apply calculated patch to current branch.
  -h, --help                 show CLI help
  -p, --patchPath=patchPath  Path to save the patch file.

ALIASES
  $ qforce patch
  $ qforce dev:patch
```

_See code: [src/commands/dev/patch.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dev/patch.ts)_

## `qforce dx:describe`

describe the command here

```
USAGE
  $ qforce dx:describe

OPTIONS
  -a, --all                To get all sObjects.
  -h, --help               show CLI help
  -r, --result=result      Relative path to save results.
  -s, --sobject=sobject    sObject name.
  -u, --username=username

ALIASES
  $ qforce describe
  $ qforce dx:describe
```

_See code: [src/commands/dx/describe.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dx/describe.ts)_

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

ALIASES
  $ qforce exe
  $ qforce dx:exe

EXAMPLE
  $ q dx:exe
```

_See code: [src/commands/dx/exe.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dx/exe.ts)_

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

_See code: [src/commands/dx/ol.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dx/ol.ts)_

## `qforce dx:open`

Open an org.

```
USAGE
  $ qforce dx:open

OPTIONS
  -h, --help               show CLI help
  -p, --path=path
  -u, --username=username

ALIASES
  $ qforce open
  $ qforce dx:open
  $ qforce o

EXAMPLE
  $ q dx:open -u uat
```

_See code: [src/commands/dx/open.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dx/open.ts)_

## `qforce dx:query`

Run a SOQL and save results to csv.

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
  $ qforce dx:query

EXAMPLE
  $ q dx:query
```

_See code: [src/commands/dx/query.ts](https://github.com/qislam/qforce/blob/v0.2.0/src/commands/dx/query.ts)_

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
