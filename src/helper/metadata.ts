import { looseObject } from './interfaces'

const path = require('path')
const fs = require('fs')

let metadataMap = new Map()
metadataMap.set('aura', {name: 'AuraDefinitionBundle', regex: , folder: 'aura'})
metadataMap.set('lwc', {name: 'LightningComponentBundle', folder: 'lwc'})
metadataMap.set('authproviders', {name: 'AuthProvider', regex: , folder: 'authproviders'})
metadataMap.set('classes', {name: 'ApexClass', regex: /\.(cls|cls-meta.xml)$/i, folder: 'classes'})
metadataMap.set('applications', {name: 'CustomApplication', regex: /\.app-meta\.xml$/i, folder: 'applications'})
metadataMap.set('aura', {name: 'AuraDefinitionBundle', folder: 'aura'})
metadataMap.set('lwc', {name: 'LightningComponentBundle', folder: 'lwc'})
metadataMap.set('authproviders', {name: 'AuthProvider', folder: 'authproviders'})
metadataMap.set('contentassets', {name: 'ContentAsset', folder: 'contentassets'})
metadataMap.set('customMetadata', {name: 'CustomMetadata', folder: 'customMetadata'})
metadataMap.set('customPermissions', {name: 'CustomPermission', folder: 'customPermissions'})
metadataMap.set('documents', {name: 'DocumentFolder', folder: 'documents'})
metadataMap.set('email', {name: 'EmailFolder', folder: 'email'})
metadataMap.set('flexipages', {name: 'FlexiPage', folder: 'flexipages'})
metadataMap.set('flows', {name: 'Flow', folder: 'flows'})
metadataMap.set('globalValueSetTranslations', {name: 'GlobalValueSetTranslation', folder: 'globalValueSetTranslations'})
metadataMap.set('globalValueSets', {name: 'GlobalValueSet', folder: 'globalValueSets'})
metadataMap.set('groups', {name: 'Group', folder: 'groups'})
metadataMap.set('labels', {name: 'CustomLabels', folder: 'labels'})
metadataMap.set('layouts', {name: 'Layout', folder: 'layouts'})
metadataMap.set('letterhead', {name: 'Letterhead', folder: 'letterhead'})
metadataMap.set('namedCredentials', {name: 'NamedCredential', folder: 'namedCredentials'})
metadataMap.set('objects', {name: 'CustomObject', folder: 'objects'})
metadataMap.set('pages', {name: 'ApexPage', folder: 'pages'})
metadataMap.set('pathAssistants', {name: 'PathAssistant', folder: 'pathAssistants'})
metadataMap.set('permissionsets', {name: 'PermissionSet', folder: 'permissionsets'})
metadataMap.set('queues', {name: 'Queue', folder: 'queues'})
metadataMap.set('queueRoutingConfigs', {name: 'QueueRoutingConfig', folder: 'queueRoutingConfigs'})
metadataMap.set('quickActions', {name: 'QuickAction', folder: 'quickActions'})
metadataMap.set('remoteSiteSettings', {name: 'RemoteSiteSetting', folder: 'remoteSiteSettings'})
metadataMap.set('reportTypes', {name: 'ReportType', folder: 'reportTypes'})
metadataMap.set('roles', {name: 'Role', folder: 'roles'})
metadataMap.set('staticresources', {name: 'StaticResource', folder: 'staticresources'})
metadataMap.set('tabs', {name: 'CustomTab', folder: 'tabs'})
metadataMap.set('triggers', {name: 'ApexTrigger', folder: 'triggers'})
metadataMap.set('workflows', {name: 'Workflow', folder: 'workflows'})

function updateFeatureYAML(
  featureYAML: looseObject = {}, 
  filePaths = [''], 
  packageBasePath = 'force-app/main/default') 
{
  for (let filePath of filePaths) {
    if (!filePath) continue
    if (filePath.indexOf(packageBasePath) == -1) continue
    if (!fs.existsSync(filePath)) continue
    const filePathParts = filePath.replace(packageBasePath + '/', '').split('/')

    let metadatType = metadataMap.get(filePathParts[0]).name || filePathParts[0]
    let metadatName = filePathParts[1]
    // apply regex when available
    if (metadataMap.get(filePathParts[0]).regex) {
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

    return featureYAML
  }
}

export {metadataMap, updateFeatureYAML}
