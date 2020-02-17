---
layout: page
title:  "qforce dev:migrate"
---

Migrate data from one org to another based on a migration plan.

### Usage

```bash
  $ qforce dev:migrate
```

### Options

```bash
  -f, --file=file                Path of migration plan file. Must be relative to cwd and in unix format.
  -s, --source=source            source org username or alias.
  -d, --destination=destination  destination org username or alias
  -n, --name=name                Name of the step to execute.
  --sample                       Copy sample migration plan files to current directory.
  -h, --help                     show CLI help
```

### Defaults

- If "source" is not provided it will default to value set in settings.
- If "destination" is not provided it will default to value set in settings.
- If "file" is not provided, it will attempt to use "migrationPlan.js". Command will fail if no file with this name is found in current directory or the path provided.

### Aliases

```bash
  $ qforce migrate
  $ qforce m
```

### Sample Plan

```js
let Plan = {
    startIndex: 0, // If set, process will start at the step index provided.
    stopIndex: 100, // If set, process will stop at the step index provided.
    source: 'prod', // Source param can be skipped on command line if set here. If both provided, value from command line will be used.
    destination: 'dev', // Same as source.
    ignoreError: true, // Default is false and process will stop on error.
    bulkStatusRetries: 3, // After loading data, how many times to query for results before continuing further.
    bulkStatusInterval: 3000, // Interval at wchich to poll for load status.
    clearDataFolder: true, // This will clear data folder before starting migration process.
    clearRefFolder: true, // This will clear data folder before starting migration process.
    steps: [
        {
            name: 'Demo_Step_1',
            description: 'Get all records and update field before load.',
            skip: false, // Default is false. Can be set to true if want to skip on a step.
            sobjecttype: 'Account',
            externalid: 'Id',
            referenceOnly: false, // Set to true if want to save results to reference folder only.
            query: `SELECT * FROM Account LIMIT 1`,
            transform: function transform(line) {
                line.Name = line['Name'].replace(/test/gi, '').trim();
                return line;
            }
        },
        {
            name: 'Demo_Step_2',
            description: 'Loading records from one org to another with external id.',
            sobjecttype: 'Contact',
            externalid: 'External_Id__c',
            isReference: true, // If set to true, results will be saved to reference folder as well as data folder.
            query: `SELECT * FROM Contact`,
        },
        {
            name: 'Demo_Step_3',
            description: 'Execution of apex code',
            apexCodeFile: 'link/to/apex/script.cls'
        },
        {
            name: 'Demo_Step_4',
            description: 'Deleting records based on ID',
            sobjecttype: 'Contact',
            query: `SELECT * FROM Contact WHERE Email = 'something@test.com`
        },
        {
            name: "Demo_Step_5",
            references: ['Demo_Step_0', 'Demo_Step_1'],
            generateData: function generateData() {
                console.log(this['Demo_Step_0'][0].Name)
                let data = []
                data.push({name: this['Demo_Step_0'][0].Name + ' generated data', email: 'someemail@example.com'})
                return data
            }
        }
    ]
}

module.exports = Plan;
```

### Use Cases

#### Back-up Data

Let us assume we need to backup all accounts, contacts and opportunities from our production org. We have already verified the org using sfdx and are using "prod" as alias. We can accomplish this by defining our steps as follows (only showing the steps, remaining structure is needed as shown above from a sample plan);

```js
let plan = {
...
  steps: [
    {
      name: 'Accounts',
      query: 'SELECT * FROM Account'
    },
    {
      name: 'Contacts',
      query: 'SELECT * FROM Contact'
    },
    {
      name: 'Opportunity',
      query: 'SELECT * FROM Opportunity'
    },
  ]
...
}
module.exports = Plan;
```

As you can see that we are using "\*" symbol in our query which is NOT supported by SOQL. The magic happens when we run the migrate command. If it encounters the "\*" symbol, it will replace it with all the fields available to context user before actually running the query. In order for this to work, we will first need to run following commands before we run the migrate command.

```bash
qforce dx:describe -s Account -u Source_Username_or_Alias
qforce dx:describe -s Contact -u Source_Username_or_Alias
qforce dx:describe -s Opportunity -u Source_Username_or_Alias
```

We only need to run the describe once for an org/sobject. So when you  run the above plan against a new org e.g. uat, you will have to run the describe command again.

Assuming we saved our plan as "dataBackupPlan.js", we will following command to download all this data.

```bash
qforce dev:migrate -f dataBackupPlan.js -s prod
```

As we are not providing the **-d** flag, it will not execute the load process. 

#### Update records

Let us assume we need to update the email for all the contacts in our uat org. Here is how we can setup the plan.

```js
let plan = {
  steps: [
    {
      name: 'Contacts',
      query: 'SELECT Id, Email FROM Contact',
      sobjecttype: 'Contact',
      externalid: 'Id',
      transform: function(line) {
        line.Email = line.Email + '.invalid'
        return line
      }
    }
  ]
}
module.exports = Plan;
```

Here is how we will execute the plan assuming we saved the plan as "contactUpdatePlan.js" and "uat" is the alias for our org where we are making the update.

```bash
qforce dev:migrate -f contactUpdatePlan.js -s uat -d uat
```

#### Copy Data From One Org to Another

Let us assume we want to copy all test accounts, contacts and opportunities from uat sandbox to our dev sandbox. We have a custom field isTest__c on Account object. We also have set external id field External_Id__c on all three objects. Here is how the plan will look like.

```js
let plan = {
...
  steps: [
    {
      name: 'Accounts',
      query: 'SELECT External_Id__c, Name, OTHER_FIELDS FROM Account WHERE isTest__c = true',
      sobjecttype: 'Account',
      externalid: 'External_Id__c'
    },
    {
      name: 'Contacts',
      query: 'SELECT External_Id__c, Account.External_Id__c, OTHER_FIELDS FROM Contact WHERE Account.isTest__c = true',
      sobjecttype: 'Contact',
      externalid: 'External_Id__c'
    },
    {
      name: 'Opportunities',
      query: 'SELECT External_Id__c, Account.External_Id__c, OTHER_FIELDS FROM Contact WHERE Account.isTest__c = true',
      sobjecttype: 'Opportunity',
      externalid: 'External_Id__c'
    }
  ]
...
}
module.exports = Plan;
```

The key here is that we have included a lookup to parent object with its external id and parent object is loaded with that external id. This same approach can be used to upload more complex data structure. We just need to make sure the order of load makes sense.