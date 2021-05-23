var express = require('express');
var router = express.Router();
const request = require('sync-request');
const constants = require('./constants');
const kusto = require('./kusto');
const util = require('util');

const buildResultUrlFormat = "https://dev.azure.com/mssonic/build/_build/results?buildId=%s&view=artifacts&pathAsName=false&type=publishedArtifacts";

const query_sonicimagebuilds = 'GetSonicImageBuilds()  | order by Platform asc, SourceBranch desc | project Sequence=row_number(), DefinitionId, DefinitionName, Platform, SourceBranch'

// Navigators
// Home/Builds|ImageBuilds/buildName|Latest/artifacts
// URL /sonicimagebuilds/<buildName>/[<buildId>|latest]/artifacts
// URL: /builds[/folder/folderName]*/<buildName>/[<buildId>|latest]/artifacts

/* Get SONiC builds. */
router.get('/sonic/builds', async function(req, res, next) {
    console.log(req);
    console.log(constants.NAVIGATOR_BARTIFACTS);
    var results = await kusto.query(query_sonicimagebuilds);
    res.render('builds', { title: 'Builds',
      columns: kusto.getColumnNames(results),
      rows: results['_rows'],
      navigators:constants.NAVIGATOR_ARTIFACTS });
  });

/* Get SONiC artifacts. */
router.get('/sonic/builds/:buildid/artifacts', function(req, res, next) {
    console.log(req);
    console.log(constants.NAVIGATOR_BARTIFACTS);
    res.render('builds', { title: 'Builds', navigators:constants.NAVIGATOR_ARTIFACTS });
  });

/* Get SONiC artifact files. */
router.get('/sonic/builds/:buildId/artifacts/:artifactId', function(req, res, next) {
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
    res.write(JSON.stringify(dataProvider));
    res.end();
  });

module.exports = router;