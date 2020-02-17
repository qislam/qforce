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

- If [DEVELOPBRANCH] is not provided, it will look for "developBranch" param in settings.

### Aliases

```bash
  $ qforce deploy
  $ qforce dev:deploy
```

### Use Cases

#### Deploy a feature

Let's say we have a "develop" branch from which feature branches are created and merged back. We are working on a feature "feature/awesome-lightning-component". As we develop, we want to deploy this feature to a different sandbox. All we need to do is to execute following command;

```bash
  $ qforce dev:deploy -u other-sandbox-alias feature/awesome-lightning-component develop
```

#### Deploy diff between two commits

Let's say we want to get our sandbox up-to-date with "develop" branch for recent changes made since a specific commit. We can use the commit hashes to accomplish this as follows.

```bash
  $ qforce dev:deploy -u my-sandbox-alias --diff 67f3b22 c15a922
```
