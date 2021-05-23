const KustoClient = require("azure-kusto-data").Client;
const KustoConnectionStringBuilder = require("azure-kusto-data").KustoConnectionStringBuilder;
const ClientRequestProperties = require("azure-kusto-data").ClientRequestProperties;
const uuidv4 = require("uuid/v4");
const NodeCache = require( "node-cache" );

const clusterConectionString = "https://sonic.westus2.kusto.windows.net";
const database = "build";

const kcs = KustoConnectionStringBuilder.withAadManagedIdentities(clusterConectionString);
const kustoClient = new KustoClient(kcs);

async function query(queryString, timoutInSeconds = 1000 * 20) {
    let clientRequestProps = new ClientRequestProperties();
    clientRequestProps.setTimeout(timoutInSeconds);
    clientRequestProps.clientRequestId = `MyApp.MyActivity;${uuidv4()}`;

    try {
        results = await kustoClient.execute(database, queryString, clientRequestProps);
        var data = [];
        return results.primaryResults[0];
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}

function parseQueryResults(items){
    var columns = items['columns'];
    var rows = items['_rows'];
    var results = [];
    for (var i=0; i<rows.length; i++){
        var row = rows[i];
        var result = {};
        for (var j=0; j<columns.length; j++){
            result[columns[j].name]=row[j];
        }
        results.push(result);
    }

    return results;
}

function getColumnNames(items){
    var columns = items['columns'];
    var results = [];
    for (var i=0; i<columns.length; i++){
        results.push(columns[i].name);
    }
    return results;
}

module.exports = Object.freeze({
    query: query,
    parseQueryResults: parseQueryResults,
    getColumnNames: getColumnNames,
});