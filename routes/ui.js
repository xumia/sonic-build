var express = require('express');
var router = express.Router();
const constants = require('./constants');
const kusto = require('./kusto');

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
router.get('/sonic/builds/:buildid/artifacts/:artifactId', function(req, res, next) {
    console.log(req);
    console.log(constants.NAVIGATOR_BARTIFACTS);
    res.render('builds', { title: 'Builds', navigators:constants.NAVIGATOR_ARTIFACTS });
  });

module.exports = router;