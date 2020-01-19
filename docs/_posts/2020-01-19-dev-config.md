---
layout: post
title:  "dev:config"
date:   2020-01-19 10:00:00 -0500
categories: docs
---

To set configuration variables for use as defaults for other commands.

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