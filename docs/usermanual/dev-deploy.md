---
layout: page
title:  "qforce dev:deploy"
---

To calculate and apply patch based on a branch. It will first check for all files committed in given [FEATUREBRANCH] and then copy them from currently checked out branch to .qforce/deploy folder.

### Usage

```bash
  $ qforce dev:deploy [FEATUREBRANCH] [DEVELOPBRANCH]
```

### Options

```bash
  -d, --diff                           Set to true if passing commit hash.
  -h, --help                           show CLI help
  -u, --username=username
  --lastDeployCommit=lastDeployCommit  Commit hash of the last commit.
```

### Defaults

- If [DEVELOPBRANCH] not provided, it will look for "developBranch" param in settings.

### Aliases

```bash
  $ qforce deploy
  $ qforce dev:deploy
```