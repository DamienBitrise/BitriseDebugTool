const BASE_URL = "https://api.bitrise.io/v0.1"
let myHeaders = new Headers();

function addDefaultHeaders(){
    myHeaders = new Headers();
    myHeaders.append("accept", "application/json");
    myHeaders.append("Authorization", API_KEY);
    requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
}

let requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
};

function getOrganizations(){
    return fetch(BASE_URL+'/organizations', requestOptions)
        .then(response => response.json())
}

function getApps(org, next){
    let nextStr = next ? '?next='+next : '';
    if(org){
        return fetch(BASE_URL+'/organizations/'+org+'/apps', requestOptions)
            .then(response => response.json())
    } else {
        return fetch(BASE_URL+'/apps'+nextStr, requestOptions)
            .then(response => response.json())
    }
    
}

function getBuild(appSlug, buildSlug, next){
    let nextStr = next ? '?next='+next : '';
    return fetch(BASE_URL+'/apps/' + appSlug + '/builds/' + buildSlug + nextStr, requestOptions)
        .then(response => response.json())
}

function getBuilds(appSlug, next){
    let nextStr = next ? '?next='+next : '';
    return fetch(BASE_URL+'/apps/'+appSlug+'/builds'+nextStr, requestOptions)
        .then(response => response.json())
}

function getBuildLogs(appSlug, buildSlug){
    return fetch(BASE_URL+'/apps/'+appSlug+'/builds/'+buildSlug+'/log', requestOptions)
        .then(response => response.json());
}

function getBuildLogContent(buildLogUrl){
    return fetch(buildLogUrl)
    .then(response => response.blob());
}

function parseLogForErrors(blob, callback){
    if(blob == 'No Log'){
        callback('No Log');
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => {
        callback(e.srcElement.result, e.srcElement.result.indexOf('events (avg/stddev):') != -1);
    });
    reader.readAsText(blob);
}

function getStats(data){
    let stats = {};
    let timings = getTimings(data);
    data.forEach(row => {
        let key = row.IP;
        let decimals = 0;
        if(!stats[key]){
            stats[key] = {
                DataCenter: row.DataCenter,
                IP: row.IP,
                Hostname: row.Hostname,
                Workflow: row.Workflow,
                MacOS: row.MacOS,
                XCode: row.XCode,
                AverageCPU: timings[key].avg_cpu.toFixed(decimals),
                AverageMemory: timings[key].avg_memory.toFixed(decimals),
                AverageFileIO: timings[key].avg_fileio.toFixed(decimals),
                AverageNetworkUp: timings[key].avg_network_up.toFixed(decimals),
                AverageNetworkDown: timings[key].avg_network_down.toFixed(decimals),
                Builds: timings[key].count
            }
        }
    })

    let statsArr = [];
    let keys = Object.keys(stats);
    keys.forEach(key => {
        statsArr.push(stats[key])
    })

    return statsArr;
}

function getKey(row){
    let groupByCluster = true;

    if(groupByCluster){
        return row.IP.split('-').slice(4,8).join('-');
    } else {
        return row.IP + '_' + row.Workflow;
    }
}

function getTimings(data){
    let benchmarkData = {};
    let lastBenchmarkData = {};
    data.forEach(row => {
        if(row.SimError == 'No Log'){
            return;
        }
        let key = row.IP;
        if(!benchmarkData[key]){
            benchmarkData[key] = {
                count: 0,
                cpu: 0,
                memory: 0,
                fileio: 0,
                network_up: 0,
                network_down: 0
            };
        }
        let timings = benchmarkData[key];
        timings.cpu += parseFloat(row.CPU);
        timings.memory += parseFloat(row.Memory);
        timings.fileio += parseFloat(row.FileIO);
        timings.network_up += row.NetworkUp;
        timings.network_down += row.NetworkDown;
        
        timings.count++;
        lastBenchmarkData[key] = {
            avg_cpu: timings.cpu/timings.count,
            avg_memory: timings.memory/timings.count,
            avg_fileio: timings.fileio/timings.count,
            avg_network_up: timings.network_up/timings.count,
            avg_network_down: timings.network_down/timings.count,
            count: timings.count
        };
    });
    return lastBenchmarkData;
}
