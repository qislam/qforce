import {looseObject} from './interfaces'

function poll(fn: any, timeout: number, interval: number, context: any) {
    let endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;

    var checkCondition = function(resolve: any, reject: any) {
        // If the condition is met, we're done! 
        let result = fn(context);
        if(result) {
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

function prepJsonForCsv(line: looseObject) {
    console.log('prep to json start')
    if (line.attributes) delete line.attributes
    for (let key of Object.keys(line)) {
      if (line[key] == 'null') line[key] = ''
      if (typeof line[key] === 'string') {
        line[key] = line[key].replace(/"/g, '""')
        line[key] = '"' + line[key] + '"'
      } else if (line[key].attributes) {
        console.log('recursive call')
        prepJsonForCsv(line[key])
      } 
    }
    console.log('prep to json end')
    return line
  }

export {poll, prepJsonForCsv}