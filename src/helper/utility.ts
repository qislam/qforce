import {dxOptions, looseObject} from './interfaces'
const path = require('path')
const sfdx = require('sfdx-node')

function poll(fn: any, timeout: number, interval: number, context: any) {
    let endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;

    var checkCondition = function(resolve: any, reject: any) {
        // If the condition is met, we're done! 
        let result = fn(context);
        console.log(result.state)
        if(result.state == 'Completed') {
            resolve(result);
        }
        // If the condition isn't met but the timeout hasn't elapsed, go again
        else if (Number(new Date()) < endTime) {
            setTimeout(checkCondition, interval, resolve, reject);
        }
        // Didn't match and too much time, reject!
        else {
            reject(new Error('timed out for ' + fn + ': ' + arguments));
        }
    };

    return new Promise(checkCondition);
}

function pollBulkStatus(options: dxOptions, timeout: number, interval: number) {
  let endTime = Number(new Date()) + (timeout || 300000);
  interval = interval || 30000;

  async function checkResults(resolve: any, reject: any) {
    let statusResults = await sfdx.data.bulkStatus(options) 
    if(statusResults[0].state == 'Completed') {
        resolve(statusResults[0]);
    }
    // If the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
        setTimeout(checkResults, interval, resolve, reject);
    }
    // Didn't match and too much time, reject!
    else {
        reject(new Error('timed out for ' + ': ' + arguments));
    }
  };

  return new Promise(checkResults);
}

function prepJsonForCsv(line: looseObject) {
  if (line.attributes) delete line.attributes
  for (let key of Object.keys(line)) {
    if (line[key] == 'null') line[key] = ''
    if (typeof line[key] === 'string') {
      line[key] = line[key].replace(/"/g, '""')
      line[key] = '"' + line[key] + '"'
    } else if (line[key].attributes) {
      prepJsonForCsv(line[key])
    } 
  }
  return line
}

function getRelativePath(rawPath: string) {
  let relativePath:string = path.join(process.cwd(), ...rawPath.trim().split('/'))
  return relativePath
}

export {getRelativePath, poll, pollBulkStatus, prepJsonForCsv}