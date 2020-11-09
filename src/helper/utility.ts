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

function getProp(object: any, prop: string) {
  if (object[prop]) return object[prop]
  for (let key in object) {
    if (key.toLowerCase() === prop.toLowerCase()) {
      return object[key]
    }
  }
}

function getRelativePath(rawPath: string) {
  let relativePath:string = path.join(...rawPath.trim().split('/'))
  return relativePath
}

function getAbsolutePath(rawPath: string) {
  let relativePath:string = path.join(process.cwd(), ...rawPath.trim().split('/'))
  return relativePath
}

async function getFiles(dir: string) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent: looseObject) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

function getQueryFields(objectDefinition:looseObject, filter: boolean) {
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
  return fieldNames
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
      let sobjecttype = query.substring(query.toLowerCase().lastIndexOf('from'),).split(/\s+/)[1].trim()
      //console.log('sobjecttype: ' + sobjecttype)
      let defPath = getAbsolutePath('.qforce/definitions/' + sobjecttype + '.json')
      if (fs.existsSync(defPath)) {
        buildQuery(JSON.parse(fs.readFileSync(defPath)))
        resolve(query)
      } else {
        sfdx.schema.sobjectDescribe({
          targetusername: targetusername, 
          sobjecttype: sobjecttype
        })
        .then(
          (objectDefinition:looseObject) => {
            if (objectDefinition && objectDefinition.fields) {
              buildQuery(objectDefinition)
              resolve(query)
            } else {
              console.log(objectDefinition)
              reject('Could not get fields for object definition. Got ' + objectDefinition)
            }
          }
        )
        .catch(
          (error: looseObject) => {
            reject('Could not get object definition.\n' + error)
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
  let statusResults: any
  async function checkResults(resolve: any, reject: any) {
    statusResults = await sfdx.data.bulkStatus(options) 
    if(statusResults && statusResults[0].state == 'Completed') {
        resolve(statusResults[0]);
    }
    // If the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
        console.log(JSON.stringify(statusResults[0], null, 4))
        setTimeout(checkResults, interval, resolve, reject);
    }
    // Didn't match and too much time, reject!
    else {
        reject(new Error('Timed out:\n' + JSON.stringify(statusResults, null, 4)));
    }
  };

  return new Promise(checkResults);
}

function prepJsonForCsv(line: looseObject) {
  if (line.attributes) delete line.attributes
  if (line.height) delete line.height
  for (let key of Object.keys(line)) {
    //console.log(key + ': ' + line[key])
    if (line[key] == '\u001b[1mnull\u001b[22m') delete line[key]
    if (line[key] === null) delete line[key]
    if (line[key] == 'null') delete line[key]
    if (line[key] === "") delete line[key]
    if (typeof line[key] === 'string') {
      line[key] = line[key].replace(/"/g, '""')
    } else if (line[key] && Object.keys(line[key])) {
      prepJsonForCsv(line[key])
    } 
  }
  return line
}

function setStepReferences(step: migrationStep, basePath: string) {
  for (let reference of step.references) {
    let referencePath = getAbsolutePath(basePath + '/reference/' + reference + '.json')
    step[reference] = JSON.parse(fs.readFileSync(referencePath, {encoding: 'utf8'}))
  }
  return step
}

function yaml2xml(featureYAML: looseObject, xmlVersion: string) {
  let featureXML: looseObject
  featureXML = {
    declaration: {
      attributes: {
        version: '1.0',
        encoding: 'UTF-8'
      }
    },
    elements: [
      {
        type: 'element',
        name: 'Package',
        attributes: {
          xmlns: 'http://soap.sforce.com/2006/04/metadata'
        },
        elements: []
      }
    ]
  }

  for (let metadataType in featureYAML) {
    if (metadataType == 'ManualSteps' || metadataType == 'Version') continue
    let typesElement: looseObject
    typesElement = {
      type: 'element',
      name: 'types',
      elements: []
    }
    if (featureYAML[metadataType]) {
      for (let metadataName of featureYAML[metadataType]) {
        typesElement.elements.push({
          type: 'element',
          name: 'members',
          elements: [
            {
              type: 'text',
              text: metadataName
            }
          ]
        })
      }
      typesElement.elements.push({
        type: 'element',
        name: 'name',
        elements: [
          {
            type: 'text',
            text: metadataType
          }
        ]
      })
    } else {
      typesElement.elements.push({
        type: 'element',
        name: 'members',
        elements: [
          {
            type: 'text',
            text: '*'
          }
        ]
      })
      typesElement.elements.push({
        type: 'element',
        name: 'name',
        elements: [
          {
            type: 'text',
            text: metadataType
          }
        ]
      })
    }
    featureXML.elements[0].elements.push(typesElement)
  }
  featureXML.elements[0].elements.push({
    type: 'element',
    name: 'version',
    elements: [
      {
        type: 'text',
        text: xmlVersion
      }
    ]
  })
  return featureXML
}

export {
  deleteFolderRecursive,
  filterQueryFields, 
  getAbsolutePath, 
  getRelativePath, 
  getFiles,
  getProp,
  getQueryAll, 
  handleNullValues,
  poll, 
  pollBulkStatus, 
  prepJsonForCsv,
  setStepReferences,
  yaml2xml
}