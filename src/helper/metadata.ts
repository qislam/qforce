import { looseObject } from './interfaces'

const path = require('path')
const fs = require('fs')

let metadataMap = new Map()
metadataMap.set('classes', {name: 'ApexClass', regex: /\.(cls|cls-meta.xml)$/i, folder: 'classes'})
metadataMap.set('applications', {name: 'CustomApplication', regex: /\.app-meta\.xml$/i, folder: 'applications'})
metadataMap.set('aura', {name: 'AuraDefinitionBundle', folder: 'aura'})
metadataMap.set('lwc', {name: 'LightningComponentBundle', folder: 'lwc'})
metadataMap.set('authproviders', {name: 'AuthProvider', regex: /\.authprovider-meta\.xml$/i, folder: 'authproviders'})
metadataMap.set('contentassets', {name: 'ContentAsset', regex: /\.(asset|asset-meta\.xml)$/i, folder: 'contentassets'})
metadataMap.set('customMetadata', {name: 'CustomMetadata', regex: /\.md-meta\.xml$/i, folder: 'customMetadata'})
metadataMap.set('customPermissions', {name: 'CustomPermission', regex: /\.customPermission-meta\.xml$/i, folder: 'customPermissions'})
metadataMap.set('documents', {name: 'DocumentFolder', regex: /\.documentFolder-meta\.xml$/i, folder: 'documents'})
metadataMap.set('email', {name: 'EmailFolder', regex: /\.emailFolder-meta\.xml$/i, folder: 'email'})
metadataMap.set('flexipages', {name: 'FlexiPage', regex: /\.flexipage-meta\.xml$/i, folder: 'flexipages'})
metadataMap.set('flows', {name: 'Flow', regex: /\.flow-meta\.xml$/i, folder: 'flows'})
metadataMap.set('globalValueSetTranslations', {name: 'GlobalValueSetTranslation', regex: /\.globalValueSetTranslation-meta\.xml$/i, folder: 'globalValueSetTranslations'})
metadataMap.set('globalValueSets', {name: 'GlobalValueSet', regex: /\.globalValueSet-meta\.xml$/i, folder: 'globalValueSets'})
metadataMap.set('groups', {name: 'Group', regex: /\.group-meta\.xml$/i, folder: 'groups'})
metadataMap.set('labels', {name: 'CustomLabels', folder: 'labels'})
metadataMap.set('layouts', {name: 'Layout', regex: /\.layout-meta\.xml$/i, folder: 'layouts'})
metadataMap.set('letterhead', {name: 'Letterhead', regex: /\.letter-meta\.xml$/i, folder: 'letterhead'})
metadataMap.set('namedCredentials', {name: 'NamedCredential', regex: /\.namedCredential-meta\.xml$/i, folder: 'namedCredentials'})
metadataMap.set('objects', {name: 'CustomObject', folder: 'objects'})
metadataMap.set('pages', {name: 'ApexPage', regex: /\.(page|page-meta\.xml)$/i, folder: 'pages'})
metadataMap.set('pathAssistants', {name: 'PathAssistant', regex: /\.pathAssistant-meta\.xml$/i, folder: 'pathAssistants'})
metadataMap.set('permissionsets', {name: 'PermissionSet', regex: /\.permissionset-meta\.xml$/i, folder: 'permissionsets'})
metadataMap.set('queues', {name: 'Queue', regex: /\.queue-meta\.xml$/i, folder: 'queues'})
metadataMap.set('queueRoutingConfigs', {name: 'QueueRoutingConfig', regex: /\.queueRoutingConfig-meta\.xml$/i, folder: 'queueRoutingConfigs'})
metadataMap.set('quickActions', {name: 'QuickAction', regex: /\.quickAction-meta\.xml$/i, folder: 'quickActions'})
metadataMap.set('remoteSiteSettings', {name: 'RemoteSiteSetting', regex: /\.remoteSite-meta\.xml$/i, folder: 'remoteSiteSettings'})
metadataMap.set('reportTypes', {name: 'ReportType', regex: /\.reportType-meta\.xml$/i, folder: 'reportTypes'})
metadataMap.set('roles', {name: 'Role', regex: /\.role-meta\.xml$/i, folder: 'roles'})
metadataMap.set('staticresources', {name: 'StaticResource', regex: /\..*$/i, folder: 'staticresources'})
metadataMap.set('tabs', {name: 'CustomTab', regex: /\.tab-meta\.xml$/i, folder: 'tabs'})
metadataMap.set('triggers', {name: 'ApexTrigger', regex: /\.(trigger|trigger-meta.xml)$/i, folder: 'triggers'})
metadataMap.set('workflows', {name: 'Workflow', regex: /\.workflow-meta\.xml$/i, folder: 'workflows'})

function updateFeatureYAML(
  featureYAML: looseObject = {}, 
  filePaths = [''], 
  packageBasePath = 'force-app/main/default'): looseObject
{
  for (let filePath of filePaths) {
    if (!filePath) continue
    if (filePath.indexOf(packageBasePath) == -1) continue
    if (!fs.existsSync(filePath)) continue
    const filePathParts = filePath.replace(packageBasePath + '/', '').split('/')
    
    let metadatType = filePathParts[0]
    if (metadataMap.get(filePathParts[0]) && metadataMap.get(filePathParts[0]).name) {
      metadatType = metadataMap.get(filePathParts[0]).name
    }

    let metadatName = filePathParts[1]
    // apply regex when available
    if (metadataMap.get(filePathParts[0]) && metadataMap.get(filePathParts[0]).regex) {
      metadatName = filePathParts[1].replace(metadataMap.get(filePathParts[0]).regex, '')
    }
    if (metadatType == 'CustomLabels') continue
    if (metadatType == 'CustomObject' && filePathParts.length > 2) {
      if (filePathParts[2] == 'fields') {
        let compName = filePathParts[3].replace(/\.field-meta\.xml$/i, '')
        if (!featureYAML.CustomField) featureYAML.CustomField = []
        featureYAML.CustomField.push(metadatName + '.' + compName)
      }
      if (filePathParts[2] == 'recordTypes') {
        let compName = filePathParts[3].replace(/\.recordType-meta\.xml$/i, '')
        if (!featureYAML.RecordType) featureYAML.RecordType = []
        featureYAML.RecordType.push(metadatName + '.' + compName)
      }
      if (filePathParts[2] == 'compactLayouts') {
        let compName = filePathParts[3].replace(/\.compactLayout-meta\.xml$/i, '')
        if (!featureYAML.CompactLayout) featureYAML.CompactLayout = []
        featureYAML.CompactLayout.push(metadatName + '.' + compName)
      }
      if (filePathParts[2] == 'listViews') {
        let compName = filePathParts[3].replace(/\.listView-meta\.xml$/i, '')
        if (!featureYAML.ListView) featureYAML.ListView = []
        featureYAML.ListView.push(metadatName + '.' + compName)
      }
      if (filePathParts[2] == 'webLinks') {
        let compName = filePathParts[3].replace(/\.webLink-meta\.xml$/i, '')
        if (!featureYAML.WebLink) featureYAML.WebLink = []
        featureYAML.WebLink.push(metadatName + '.' + compName)
      }
    }
    if (metadatType == 'DocumentFolder' && filePathParts.length > 2) {
      let documentName = filePathParts[2].replace(/\..*$/i, '')
      if (!featureYAML.Document) featureYAML.Document = []
      featureYAML.Document.push(metadatName + '/' + documentName)
    }
    if (metadatType == 'EmailFolder' && filePathParts.length > 2) {
      let emailTemplate = filePathParts[2].replace(/\..*$/i, '')
      if (!featureYAML.EmailTemplate) featureYAML.EmailTemplate = []
      featureYAML.EmailTemplate.push(metadatName + '/' + emailTemplate)
    }
    //let metadatName = filePathParts[1].replace(/\..*\.xml$/i, '').replace(/\.(cls|page|asset|trigger)$/i, '')
    if (!featureYAML[metadatType]) featureYAML[metadatType] = []
    featureYAML[metadatType].push(metadatName)
  }

  return featureYAML
}

export {metadataMap, updateFeatureYAML}
