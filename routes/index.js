var express = require('express');
var router = express.Router();
const util = require('util');
const request = require('sync-request');
const constants = require('./constants');
const az_resource = 'https://management.azure.com/';
const kusto = require('./kusto');

const succeededBuildUrlFormat = "https://dev.azure.com/%s/%s/_apis/build/builds?definitions=%s&branchName=refs/heads/%s&resultFilter=succeeded&statusFilter=completed&$top=1";
const artifactUrlFormat = "https://dev.azure.com/%s/%s/_apis/build/builds/%s/artifacts?artifactName=%s";
const buildResultUrlFormat = "https://dev.azure.com/%s/%s/_build/results?buildId=%s&view=results";

const platformMapping = constants.PLATFORMS;

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
    res.redirect(downloadUrl);
}

function RedirectSonicArtifacts(req, res, next) {
    var params = req.params;
    var query = req.query;
    params['organization'] = 'mssonic';
    params['project'] = 'build';
    if (params['buildId'] == null) {
        params['buildId'] = 'latest';
    }

    var definitionId = query.definitionId;
    var platform = query.platform;
    if (definitionId == null){
        if (platform == null){
            var message = "The parameter platform is empty.";
            return res.status(400).json({status: 400, message: message});
        }
        definitionId = platformMapping[platform];
        if (definitionId == null){
            var message = util.format("The platform '%s' is not defined.", platform);
            return res.status(400).json({status: 400, message: message});
        }
    }

    params['definitionId'] = definitionId;
    if (query.target != null){
        query.subPath = query.target;
    }
    
    if (query['artifactName'] == null){
        query['artifactName'] = 'sonic-buildimage.' + platform; 
    }

    RedirectArtifacts(req, res, next);
}

function GetToken(req, res, next) {
  var url = `${process.env["IDENTITY_ENDPOINT"]}/?resource=${az_resource}&api-version=2019-08-01`;
  var options = {
    headers: {'X-IDENTITY-HEADER': process.env["IDENTITY_HEADER"]}
  };
  var tokenRes = request('GET', url, options);
  res.write(tokenRes.getBody('utf8'));
  res.end();
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/ui/sonic/pipelines');
});

/* Redirect to the latest build */
router.get('/azp/:organization/:project/_apis/build/definition/:definitionId/build/latest', RedirectLatestBuildResults);

/* Get the build artifacts
* Query: ?branchName=<master>&artifactName=<sonic-buildimage.vs>&subPath=</target/sonic-vs.img.gz>&format=<file|zip>
*/
router.get('/azp/:organization/:project/_apis/build/definition/:definitionId/build/:buildId/artifacts', RedirectArtifacts);

/* Get the SONiC build artifacts */
router.get('/sonic/artifacts', RedirectSonicArtifacts); // Deprecated
router.get('/api/sonic/artifacts', RedirectSonicArtifacts);

router.get('/api/token', GetToken);

module.exports = router;