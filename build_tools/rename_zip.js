const shell=require('child_process').execSync

packageJson = require('../package.json')
osdJson = require('../opensearch_dashboards.json')

old_name = `build/${osdJson.id}-${osdJson.opensearchDashboardsVersion}.zip`
new_name = `build/${packageJson.name}-${packageJson.version}.zip`

console.log("rename "+old_name+" to "+new_name)
shell(`mv ${old_name} ${new_name}`)
