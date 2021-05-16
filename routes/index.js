var express = require('express');
var router = express.Router();
const util = require('util');
const request = require('sync-request');

const succeededBuildUrlFormat = "https://dev.azure.com/%s/%s/_apis/build/builds?definitions=%s&branchName=refs/heads/%s&resultFilter=succeeded&statusFilter=completed&$top=1";
const artifactUrlFormat = "https://dev.azure.com/%s/%s/_apis/build/builds/%s/artifacts?artifactName=%s";
const buildResultUrlFormat = "https://dev.azure.com/%s/%s/_build/results?buildId=%s&view=results";

function GetLatestBuild(req) {
  var params = req.params;
  var query = req.query;
  var succeededBuildUrl = util.format(succeededBuildUrlFormat, params.organization, params.project, params.definitionId, query.branchName);
  var buildRes = request('GET', succeededBuildUrl);
  var build = JSON.parse(buildRes.getBody('utf8'));
  return build;
}

function RedirectLatestBuildResults(req, res, next) {
  var params = req.params;
  var query = req.query;
  var build = GetLatestBuild(req);
  var value = build.value[0];
  var buildResultUrl = util.format(buildResultUrlFormat, params.organization, params.project, value.id);
  res.redirect(buildResultUrl);
}


function RedirectArtifacts(req, res, next) {
    var params = req.params;
    var query = req.query;
    var buildId = params.buildId;
    if (typeof buildId !== 'number'){
        if (buildId != 'latest'){
              var message = util.format("The parameter buildId '%s' is not correct, should be a number value or the value 'laster'.", buildId);
              return res.status(400).json({status: 400, message: message});
        }

        var build = GetLatestBuild(req);
        var value = build.value[0];
        buildId = value.id;
    }
    
    var artifactUrl = util.format(artifactUrlFormat, params.organization, params.project, value.id, query.artifactName);
    var artifactRes = request('GET', artifactUrl, {json: {"Content-type": "application/json"}});
    var artifact = JSON.parse(artifactRes.getBody('utf8'));
    var downloadUrl = artifact.resource.downloadUrl;
    if (query.subPath != null){
        if (query.format != "zip"){
            var queryFormat = query.format == null ? 'file' : query.format;
            downloadUrl = downloadUrl.replace('format=zip', util.format('format=%s', queryFormat));
        }
        var subPath = query.subPath;
        if (!subPath.startsWith('/')){
            subPath = '/' + subPath;
      }
      downloadUrl = downloadUrl + "&subPath=" + subPath;
    }
    //console.log(downloadUrl);
    res.redirect(downloadUrl);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Redirect to the latest build */
router.get('/azp/:organization/:project/_apis/build/definition/:definitionId/build/latest', RedirectLatestBuildResults);

/* Get the build artifacts    `
* Query: ?branchName=<master>&artifactName=<sonic-buildimage.vs>&subPath=</target/sonic-vs.img.gz>&format=<file|zip>
*/
router.get('/azp/:organization/:project/_apis/build/definition/:definitionId/build/:buildId/artifacts', RedirectArtifacts);

module.exports = router;