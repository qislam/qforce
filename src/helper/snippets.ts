import { looseObject } from './interfaces'

const qforceSnippet: looseObject = {
	migrate: {
		prefix: "migrate",
		body: [
			"let plan = {",
				"\tbulkStatusInterval: 30000,",
				"\tbulkStatusRetries: 18,",
				"\tsteps: [",
					"\t\t{",
						"\t\t\tname: '$1',",
						"\t\t\tsobjecttype: '$1',",
						"\t\t\texternalid: '\${0:Id}',",
						"\t\t\tquery: \`SELECT Id FROM $1\`",
					"\t\t}",
				"\t]",
			"}",
			"module.exports = plan;"
		]
	},
	clearDataFolder: {
		prefix: "clearDataFolder",
		body: ["clearDataFolder: true,$0"]
	},
	clearRefFolder: {
		prefix: "clearRefFolder",
		body: ["clearRefFolder: true,$0"]
	},
	ignoreError: {
		prefix: "ignoreError",
		body: ["ignoreError: true,$0"]
	},
	destination: {
		prefix: "destination",
		body: ["destination: '\${0:dev}',"]
	},
	source: {
		prefix: "source",
		body: ["source: '\${0:dev}',"]
	},
	generateData: {
		prefix: "generateData",
		body: [
			"generateData: function generateData() {",
			"\tlet data = [];",
			"\tdata.push({$0});",
			"\treturn data;",
			"}"
		]
	},
	calculateFlags: {
		prefix: "calculateFlags",
		body: [
			"calculateFlags: function calculateFlags() {",
				"\tthis.skip = true;",
			"}"
		]
	},
	transform: {
		prefix: "transform",
		body: [
			"transform: function transform(line) {",
				"\tline.Name = '$0';",
				"\treturn line;",
			"}"
		]
	},
	transformAll: {
		prefix: "transformAll",
		body: [
			"transformAll: function transformAll(records) {",
				"\tlet data = [];",
				"\tfor (let line of records) {",
					"\t\tdata.push({",
						"\t\t\tId: line.Id$0",
					"\t\t});",
				"\t}",
				"\treturn data;",
			"}"
		]
	},
	step: {
		prefix: "step",
		body: [
			"{",
				"\tname: '$1',",
				"\tsobjecttype: '$1',",
				"\texternalid: '\${0:External_Id__c}',",
				"\tquery: \`SELECT * FROM $1\`",
			"}"
		]
	},
	references: {
		prefix: "references",
		body: "references: ['$0'],"
	},
	queryDestination: {
		prefix: "queryDestination",
		body: "queryDestination: true,$0"
	}
}

export {qforceSnippet}
