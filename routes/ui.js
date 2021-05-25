var express = require('express');
var router = express.Router();
const request = require('sync-request');
const constants = require('./constants');
const kusto = require('./kusto');
const util = require('util');

const buildUrlFormat = "https://dev.azure.com/mssonic/build/_apis/build/builds?definitions=%s&branchName=refs/heads/%s&statusFilter=completed";
const buildResultUrlFormat = "https://dev.azure.com/mssonic/build/_build/results?buildId=%s&view=artifacts&pathAsName=false&type=publishedArtifacts";
const artifactUrlFormat = "https://dev.azure.com/mssonic/build/_apis/build/builds/%s/artifacts";

const query_sonicimagebuilds = 'GetSonicImageBuilds()  | order by Platform asc, SourceBranch desc | project Sequence=row_number(), DefinitionId, DefinitionName, Platform, SourceBranch'

function GetArtifactItems(items){
  var results = [];
  if (items == null){
    return results;
  }
  for(var i= 0; i < items.length; i++){
    var item = items[i];
    if (item.name.startsWith("/target/versions")
     || item.name.startsWith('/target/baseimage')){
      continue;
    }

    results.push(item);
    var itemResults = GetArtifactItems(item.items);
    item['items'] = null;
    results.push(...itemResults);
  }

  return results;
}

function GetArtifacts(artifacts){
    for(var item in artifacts.item);
}

// Navigators
// Home/Builds|ImageBuilds/buildName|Latest/artifacts
// URL /sonicimagebuilds/<buildName>/[<buildId>|latest]/artifacts
// URL: /builds[/folder/folderName]*/<buildName>/[<buildId>|latest]/artifacts

/* Get SONiC pipelines. */
router.get('/sonic/pipelines', async function(req, res, next) {
    console.log(req);
    console.log(constants.NAVIGATOR_BARTIFACTS);
    var results = await kusto.query(query_sonicimagebuilds);
    res.render('pipelines', { title: 'Builds',
      columns: kusto.getColumnNames(results),
      rows: results['_rows'],
      navigators:constants.NAVIGATOR_ARTIFACTS });
  });

/* Get SONiC builds. */
router.get('/sonic/pipelines/:definitionId/builds', function(req, res, next) {
  var params = req.params;
  var query = req.query;
  var url = util.format(buildUrlFormat, params.definitionId, query.branchName)
  var buildsRes = request('GET', url);
  var builds = JSON.parse(buildsRes.getBody('utf8'));
  for(var i=0; i<builds['value'].length; i++){
    var row = builds['value'][i];
    console.log(i);
    console.log(row._links.web.href);
  }
  res.render('builds', { title: 'Builds',
      rows: builds['value'],
      navigators:constants.NAVIGATOR_ARTIFACTS });
});

/* Get SONiC artifacts. */
router.get('/sonic/pipelines/:definitionId/builds/:buildId/artifacts', function(req, res, next) {
  var params = req.params;
  var query = req.query;
  var url = util.format(artifactUrlFormat, params.buildId)
  var artifactsRes = request('GET', url);
  var artifacts = JSON.parse(artifactsRes.getBody('utf8'));
  for(var i=0; i<artifacts['value'].length; i++){
    var row = artifacts['value'][i];
    row["seq"] = i + 1;
    row["definitionId"] = params.definitionId;
    row["buildId"] = params.buildId;
    console.log(i);
    console.log(row.name);
  }
  console.log(artifacts['value']);
  res.render('artifact-names', { title: 'Artifacts',
      rows: artifacts['value'],
      navigators:constants.NAVIGATOR_ARTIFACTS });
  });

/* Get SONiC artifact files. */
router.get('/sonic/pipelines/:definitionId/builds/:buildId/artifacts/:artifactId', function(req, res, next) {
    var params = req.params;
    var query = req.query;
    var sourceUrl = util.format(buildResultUrlFormat, params.buildId);
    var url = 'https://dev.azure.com/mssonic/_apis/Contribution/HierarchyQuery/project/be1b070f-be15-4154-aade-b1d3bfb17054';
    var body = {"contributionIds":["ms.vss-build-web.run-artifacts-data-provider"],
    "dataProviderContext":{"properties":{
      "artifactId":params.artifactId,
      "buildId":params.buildId,
      "sourcePage":{
        "url": sourceUrl,
        "routeValues":{"project":"build","action":"Execute"}
      }}}};
    var options = {
      headers: {'accept': 'application/json;api-version=5.0-preview.1',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    };
    var artifactsRes = request('POST', url, options);
    var artifacts = JSON.parse(artifactsRes.getBody('utf8'));
    var dataProvider = artifacts['dataProviders']['ms.vss-build-web.run-artifacts-data-provider'];
    var items = GetArtifactItems(dataProvider.items);
    for (var i=0; i<items.length; i++){
        items[i]['seq'] = i + 1;
    }
    res.render('artifacts', { title: 'Artifacts',
      rows: items,
      navigators:constants.NAVIGATOR_ARTIFACTS });
});

module.exports = router;