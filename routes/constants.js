const navigator_builds = [{name:'Builds', href:'/builds'}];
const navigator_artifacts = navigator_builds.concat([{name:'Artifacts', href:'/builds/artifacts'}]);


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

module.exports = Object.freeze({
    NAVIGATOR_BUILDS: navigator_builds,
    NAVIGATOR_ARTIFACTS: navigator_artifacts,
    PLATFORMS: platformMapping,
});