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

### Use Cases

#### Copy changes from one branch to another

Let's say we were working on two separate features in their own branches; feature/awesome-comp-1 and feature/awesome-comp-2 and we would to merge all the changes into one without merging them. Assuming we have currently checked out feature/awesome-comp-1, we can apply feature/awesome-comp-2 changes as follows;

```bash
  $ qforce dev:patch --apply feature/awesome-comp-2 develop
```

If we only need to create a patch but not apply it, we can omit the "--apply" parameter.

```bash
  $ qforce dev:patch --apply feature/awesome-comp-2 develop
```

This will create a patch file with feature branch name and save it in .qforce/patches directory.

#### Retrieving changes from upstream

Let's say we are working on an idea at "feature/awesome-idea" branch which originated from "develop" branch. Since we started working on it, some other changes have been committed to develop that overlap with our changes. We can retrieve any changes made to files in our branch from upstream branch as follows;

```bash
  $ qforce dev:patch --apply --syncUp feature/awesome-idea develop
```
