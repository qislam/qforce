# Handle Salesforce data; the easy way

<!-- TOC -->

- [Handle Salesforce data; the easy way](#handle-salesforce-data-the-easy-way)
  - [The Challenge](#the-challenge)
  - [Setting the stage](#setting-the-stage)
  - [Getting Started](#getting-started)
  - [Making the plan](#making-the-plan)
    - [Back-up Data](#back-up-data)
    - [Update records](#update-records)
    - [Copy Data From One Org to Another](#copy-data-from-one-org-to-another)
  - [Conclusion](#conclusion)

<!-- /TOC -->

## The Challenge

During the lifecycle of a typical salesfroce project, we have to download, process and upload data from one salesforce org to another. Salesforce Dataloader, although a good tool, can sometime be cumbersome and hard to use. In this article, we will will learn how to setup these data jobs efficiently and effortlessly.

## Setting the stage

We will be using a command line tool "qforce" for this article. To install, run the following command;

```bash
npm install -g qforce
```

If you don't have already installed node/npm go [here](https://www.npmjs.com/get-npm) for instructions. You should also have already installed the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli).

## Getting Started

Once installed, Run following command from a directory/folder where you would like to save your data and related files.

```bash
qforce dev:migrate --sample
```

You will see a MigrationPlanSample.js file created. If you open this file in your code editor, you will see something like

```js
let Plan = {
  startIndex: 0, // If set, process will start at the step index provided.
  stopIndex: 1, // If set, process will stop at the step index provided.
  ...
  steps: [
    {
      name: 'Demo_Step_1',
      description: 'Get all records and update field before load.',
      skip: false, // Default is false. Can be set to true if want to skip on a step.
      sobjecttype: 'Account',
      externalid: 'Id',
      query: `SELECT * FROM Account LIMIT 1`,
      transform: function transform(line) {
          line.Name = line.Name + ' 1'; //line['Name'].replace(/transformed/gi, '').trim();
          return line;
      }
    },
    ...
  ]
}

module.exports = Plan;
```

More about migration plan and steps later but assuming you are ready to run the migration, all you have to do is run following command.

```bash
qforce dev:migrate -f path/to/migration/plan -s Source_Username_or_Alias -d destination_Username_or_Alias
```

You will see the progress on the command line as it goes through the steps. As the data is queried and processed, it will saved in "data" folder as csv files. You can expect to see one csv file for each step with same name as the step name.

Is that not easy...

Let's now take a deeper look at how to construct the plan.

## Making the plan

> "Plans are nothing; planning is everything." **Dwight D. Eisenhower**

Well, in our case **Plan** is everything as *it* is what is executed by the system to a t.

We will be looking at the following use cases.

- Back-up data
- Update records
- Copy data from one org to another

### Back-up Data

Let us assume we need to back all accounts, contacts and opportunities from our production org. We have already verified the org using sfdx and are using "prod" as alias. We can accomplish this by defining our steps as follows (only showing the steps, remaining structure is needed as shown above from a sample plan);

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

### Update records

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

### Copy Data From One Org to Another

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

## Conclusion

In this article we learned how to use qforce cli to manage various everyday data tasks. qforce has some other commands that you checkout in its documentation. If you face any issues, let me know (quimatics@gmail.com).

Happy coding.
