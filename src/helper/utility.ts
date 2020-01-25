import {dxOptions, looseObject, migrationStep} from './interfaces'
const path = require('path')
const fs = require('fs')
const sfdx = require('sfdx-node')
const csvjson = require('csvjson')

function deleteFolderRecursive(pathString: string) {
  let dataPath = pathString.split('/')
  let basePath = path.join(process.cwd(), ...dataPath)
  if( fs.existsSync(basePath) ) {
    fs.readdirSync(basePath).forEach((file: string,index: number) => {
      let curPath = path.join(process.cwd(), ...dataPath, file)
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(dataPath.join('/') + '/' + file);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(basePath);
  }
}

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
  function buildQuery(objectDefinition:looseObject) {
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
  }
  return new Promise(
    (resolve, reject) => {
      let sobjecttype = query.substring(query.toLowerCase().indexOf('from'),).split(/\s+/)[1].trim()
      let defPath = getAbsolutePath('.qforce/definitions/' + targetusername + '/' + sobjecttype + '.json')
      if (!fs.existsSync(defPath)) {
        buildQuery(JSON.parse(fs.readFileSync(defPath)))
        resolve(query)
      } else {
        sfdx.schema.sobjectDescribe({
          targetusername: targetusername, 
          sobjecttype: sobjecttype
        })
        .then(
          (objectDefinition:looseObject) => {
            buildQuery(objectDefinition)
            resolve(query)
          }
        )
      }
    }
  )
}

function handleNullValues(line: looseObject) {
  for (let key of Object.keys(line)) {
    if (line[key] == '\u001b[1mnull\u001b[22m') line[key] = ''
    if (line[key] == 'null') line[key] = ''
    if (line[key] == null) line[key] = ''
  }
  return line
}

function poll(fn: any, timeout: number, interval: number, context: any) {
    let endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;

    var checkCondition = function(resolve: any, reject: any) {
        // If the condition is met, we're done! 
        let result = fn(context);
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

function pollBulkStatus(options: dxOptions, retries = 3, interval = 5000) {
  let endTime = Number(new Date()) + retries * interval

  async function checkResults(resolve: any, reject: any) {
    let statusResults = await sfdx.data.bulkStatus(options) 
    if(statusResults && statusResults[0].state == 'Completed') {
        resolve(statusResults[0]);
    }
    // If the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
        setTimeout(checkResults, interval, resolve, reject);
    }
    // Didn't match and too much time, reject!
    else {
        reject(new Error('Timed out:\n' + JSON.stringify(statusResults, null, 2)));
    }
  };

  return new Promise(checkResults);
}

function prepJsonForCsv(line: looseObject) {
  if (line.attributes) delete line.attributes
  if (line.height) delete line.height
  for (let key of Object.keys(line)) {
    if (line[key] == '\u001b[1mnull\u001b[22m') delete line[key]
    if (line[key] == 'null') delete line[key]
    if (line[key] === "") delete line[key]
    if (typeof line[key] === 'string') {
      line[key] = line[key].replace(/"/g, '""')
      line[key] = '"' + line[key] + '"'
    } else if (line[key] && line[key].attributes) {
      prepJsonForCsv(line[key])
    } 
  }
  return line
}

function setStepReferences(step: migrationStep, basePath: string) {
  for (let reference of step.references) {
    let refReference = getAbsolutePath(basePath + '/reference/' + reference + '.csv')
    let dataReference = getAbsolutePath(basePath + '/data/' + reference + '.csv')
    if(fs.existsSync(refReference)) {
      step[reference] = csvjson.toObject(fs.readFileSync(refReference, {encoding: 'utf8'}))
    } else if(fs.existsSync(dataReference)) {
      step[reference] = csvjson.toObject(fs.readFileSync(dataReference, {encoding: 'utf8'}))
    }
  }
  return step
}

export {
  deleteFolderRecursive,
  filterQueryFields, 
  getAbsolutePath, 
  getRelativePath, 
  getQueryAll, 
  handleNullValues,
  poll, 
  pollBulkStatus, 
  prepJsonForCsv,
  setStepReferences
}