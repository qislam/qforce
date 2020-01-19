---
layout: post
title:  "dev:migrate"
date:   2020-01-19 10:00:00 -0500
categories: docs
---

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