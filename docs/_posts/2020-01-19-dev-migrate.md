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
  -f, --file=file                Path of migration plan file. Must be relative to cwd and in unix format.
  -s, --source=source            source org username or alias.
  -d, --destination=destination  destination org username or alias
  -n, --name=name                Name of the step to execute.
  --sample                       Copy sample migration plan files to current directory.
  -h, --help                     show CLI help

ALIASES
  $ qforce migrate
  $ qforce m
```

Here is a sample plan file.

```js
let Plan = {
    startIndex: 0, // If set, process will start at the step index provided.
    stopIndex: 1, // If set, process will stop at the step index provided.
    source: 'prod', // Source param can be skipped on command line if set here. If both provided, value from command line will be used.
    destination: 'dev', // Same as source.
    ignoreError: true, // Default is false and process will stop on error.
    bulkStatusRetries: 3, // After loading data, how many times to query for results before continuing further.
    bulkStatusInterval: 30000, // Interval at wchich to poll for load status.
    clearDataFolder: true, // This will clear data folder before starting migration process.
    steps: [
        {
            name: 'Demo_Step_1',
            description: 'Get all records and update field before load.',
            skip: false, // Default is false. Can be set to true if want to skip on a step.
            sobjecttype: 'Account',
            externalid: 'Id',
            referenceOnly: false, // Set to true if want to save to reference folder instead of data
            query: `SELECT * FROM Account LIMIT 1`,
            transform: function transform(line) {
                line.Name = line.Name + ' 1'; //line['Name'].replace(/transformed/gi, '').trim();
                return line;
            }
        },
        {
            name: 'Demo_Step_2',
            description: 'Loading records from one org to another with external id.',
            sobjecttype: 'Contact',
            externalid: 'External_Id__c',
            query: `SELECT * FROM Contact`,
        }
    ]
}

module.exports = Plan;
```