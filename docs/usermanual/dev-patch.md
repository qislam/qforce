---
layout: page
title:  "qforce dev:patch"
---

To calculate and apply patch based on current branch. 

### Usage

```bash
  $ qforce dev:patch [FEATUREBRANCH] [DEVELOPBRANCH]
```

### Options

```bash
  -a, --apply                Set to true if want to apply calculated patch to current branch.
  -h, --help                 show CLI help
  -p, --patchPath=patchPath  Path to save the patch file.
```

### Defaults

- [DEVELOPBRANCH] parameter can be omitted if set in the settings.js file for current working directory.
- --patchPath can be omitted if set in the settings.js file for current working directory.

### Aliases

```bash
  $ qforce patch
  $ qforce dev:patch
```