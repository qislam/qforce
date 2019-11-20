import {dxOptions, looseObject} from './interfaces'
const path = require('path')
const fs = require('fs')
const sfdx = require('sfdx-node')

function filterQueryFields(queryString: string, targetusername: string, externalIdField: string) {
  let filteredQuery = ''
  try {
    let selectPart = queryString.substring(0, queryString.toLowerCase().indexOf('from'))
    let fromPart = queryString.substring(queryString.toLowerCase().indexOf('from'),)
    let originalFields = selectPart.toLowerCase().split(/\s+/)
    originalFields.shift()
    let sobjectName = fromPart.split(/\s+/)[1]
    let jsonPath = getAbsolutePath('.qforce/definitions/' + 
      targetusername + '/' + 
      sobjectName.toLowerCase() + 
      '.json')
    let objectDefinition;
    if(fs.existsSync(jsonPath)) {
      objectDefinition = JSON.parse(fs.readFileSync(jsonPath))
    }
    let createableFields = []
    for (let field of objectDefinition.fields) {
      if (field.createable) createableFields.push(field.name.toLowerCase())
    }
    for (let field of originalFields) {
      field = field.trim().replace(',', '')
      if (!filteredQuery) {
        filteredQuery = 'SELECT ' + externalIdField + ' '
      } else if (createableFields.includes(field)) {
        filteredQuery = filteredQuery + ', ' + field
      }
    }
    filteredQuery = filteredQuery + ' ' + fromPart
  } catch(err) {
    console.log(JSON.stringify(err, null, 2))
    return queryString
  }
  return filteredQuery
}

function getRelativePath(rawPath: string) {
  let relativePath:string = path.join(...rawPath.trim().split('/'))
  return relativePath
}

function getAbsolutePath(rawPath: string) {
  let relativePath:string = path.join(process.cwd(), ...rawPath.trim().split('/'))
  return relativePath
}

function getQueryAll(query: string, targetusername: string, filter: boolean) {
  return new Promise(
    (resolve, reject) => {
      let sobjecttype = query.substring(query.toLowerCase().indexOf('from'),).split(/\s+/)[1].trim()
      sfdx.schema.sobjectDescribe({
        targetusername: targetusername, 
        sobjecttype: sobjecttype
      })
      .then(
        (objectDefinition:looseObject) => {
          let fieldNames = ''
          let tooManyFields = objectDefinition.fields.length > 100
          for (let field of objectDefinition.fields) {
            if(filter || tooManyFields) {
              if(!field.createable || 
                field.type == 'reference' || 
                (field.defaultedOnCreate && !field.updateable)) continue
            }
            if (fieldNames) fieldNames = fieldNames + ', ' + field.name
            else fieldNames = field.name
          }
          if (fieldNames) query = query.replace(/\*/g, fieldNames)
          resolve(query)
        }
      )
    }
  )
}

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

function pollBulkStatus(options: dxOptions, retries: number, interval: number) {
  let endTime = Number(new Date()) + (retries * interval || 150000);
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
        reject(new Error('Timed out:\n' + JSON.stringify(statusResults[0], null, 2)));
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

export {
  filterQueryFields, 
  getAbsolutePath, 
  getRelativePath, 
  getQueryAll, 
  poll, 
  pollBulkStatus, 
  prepJsonForCsv
}