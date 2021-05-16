var express = require('express');
var router = express.Router();
const util = require('util');
const request = require('sync-request');

const succeededBuildUrlFormat = "https://dev.azure.com/%s/%s/_apis/build/builds?definitions=%s&branchName=refs/heads/%s&resultFilter=succeeded&statusFilter=completed&$top=1";
const artifactUrlFormat = "https://dev.azure.com/mssonic/build/_apis/build/builds/%s/artifacts?artifactName=%s";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

function artifacts(req, res, next) {
    var params = req.params;
    var query = req.query;
    var buildId = params.buildId;
    if (typeof buildId !== 'number'){
        if (buildId != 'latest'){
              var message = util.format("The parameter buildId '%s' is not correct, should be a number value or the value 'laster'.", buildId);
              return res.status(400).json({status: 400, message: message});
        }
        var succeededBuildUrl = util.format(succeededBuildUrlFormat, params.organization, params.project, params.definitionId, query.branchName);
        console.log(succeededBuildUrl);
        var buildRes = request('GET', succeededBuildUrl);
        var build = JSON.parse(buildRes.getBody('utf8'));
        var value = build.value[0];
        buildId = value.id;
    }
    
    var artifactUrl = util.format(artifactUrlFormat, value.id, query.artifactName);
    var artifactRes = request('GET', artifactUrl, {json: {"Content-type": "application/json"}});
    var artifact = JSON.parse(artifactRes.getBody('utf8'));
    var downloadUrl = artifact.resource.downloadUrl;
    if (query.subPath != null){
        if (query.format != "zip"){
            var queryFormat = query.format == null ? 'file' : query.format;
            downloadUrl = downloadUrl.replace('format=zip', util.format('format=%s', queryFormat));
        }
        downloadUrl = downloadUrl + "&subPath=" + query.subPath;
    }
    //console.log(downloadUrl);
    res.redirect(downloadUrl);
}

// Query: ?branchName=<master>&artifactName=<sonic-buildimage.vs>&subPath=</target/sonic-vs.img.gz>&format=<file|zip>
router.get('/azp/:organization/:project/_apis/build/definitions/:definitionId/builds/:buildId/artifacts', artifacts);

module.exports = router;