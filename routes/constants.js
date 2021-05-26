const navigator_builds = [{name:'Pipelines', href:'/Pipelines'}];
const navigator_artifacts = navigator_builds.concat([{name:'Artifacts', href:'/Pipelines/artifacts'}]);


const platformMapping = {"broadcom" : 138,
"barefoot" : 146,
"centec" : 143,
"centec-arm64" : 140,
"generic": 147,
"innovium" : 148,
"marvell-armhf" : 141,
"mellanox": 139,
"nephos" : 149,
"vs" : 142,};

function reverse(mapping){
    var results = {};
    for (var k in mapping){
        results[mapping[k]] = k;
    }
    return results;
}

const definitionToPlatformMapping = reverse(platformMapping);

module.exports = Object.freeze({
    PLATFORMS: platformMapping,
    DEFINITIONS: definitionToPlatformMapping,
});