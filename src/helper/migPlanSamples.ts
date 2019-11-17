import { looseObject } from './interfaces'

const basic: string = `
let Plan = {
    startIndex: 0, // If set, process will start at the step index provided.
    stopIndex: 1, // If set, process will stop at the step index provided.
    source: 'prod', // Source param can be skipped on command line if set here. If both provided, value from command line will be used.
    destination: 'dev', // Same as source.
    ignoreError: true, // Default is false and process will stop on error.
    bulkStatusRetries: 3, // After loading data, how many times to query for results before continuing further.
    bulkStatusInterval: 30000, // Interval at wchich to poll for load status.
    steps: [
        {
            name: 'Demo_Step_1',
            description: 'Get all records and update field before load.',
            skip: false, // Default is false. Can be set to true if want to skip on a step.
            sobjecttype: 'Account',
            externalid: 'Id',
            query: \`SELECT * FROM Account LIMIT 1\`,
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
            query: \`SELECT * FROM Contact\`,
        }
    ]
}

module.exports = Plan;
`

const allSamples: looseObject = {
    MigrationPlanSample: basic
}

export {allSamples}