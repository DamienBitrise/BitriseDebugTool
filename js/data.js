let orgs = [];
let selectedOrg = null;
let apps = [];
let selectedApp = null;
async function loadAPIData(){
    addDefaultHeaders();
    getOrganizations().then(async (res)=>{
        orgs = res.data.map((org)=> {return {slug: org.slug, name: org.name}});
        buildOrgList(orgs);

        let response = null, next = null;
        do {
            response = await getApps(selectedOrg, next)
            next = response.paging ? response.paging.next : null;
            apps = apps.concat(response.data);
        } while(next && next != '')

        console.log(apps);
        buildAppList(apps);

        // getApps(selectedOrg).then((res)=>{
        //     apps = res.data;
        //     buildAppList(apps);
        // });
    });
}

// Test build slug 
// https://app.bitrise.io/build/7ed223ab-41d4-4702-96fd-806ccf57f410

function findAppSlug(buildSlug){
    let ownerAppSlug = null
    apps.forEach(async (app)=>{
        if(!ownerAppSlug){
            response = await getBuild(app.slug, buildSlug);
            if(response && response.message != 'Not Found' && response.message != 'Forbidden'){
                ownerAppSlug = app.slug;
                processLogs(ownerAppSlug, buildSlug, async (log)=>{
                    console.log('log:',log);
                    leftOriginal = log;
                    diffEditor.dispose();
                    await loadEditor();
                });
            }
        }
    })
}

function processLogs(appSlug, buildSlug, callback){
    return getBuildLogs(appSlug, buildSlug)
        .then(result => {
            if(result.expiring_raw_log_url){
                return getBuildLogContent(result.expiring_raw_log_url)
                    .then(blob => {
                        const reader = new FileReader();
                        reader.addEventListener('loadend', (e) => {
                            callback(e.srcElement.result);
                        });
                        reader.readAsText(blob);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            } else {
                console.log('Error: MNo build log found!');
            }
        })
        .catch(error => console.log('error', error));
}

function buildOrgList(orgArray){
    let selectHTML = '';
    if(!selectedOrg || selectedOrg == ''){
        selectHTML += '<option value="" selected>All</option>';
    } else {
        selectHTML += '<option value="">All</option>';
    }
    orgArray.forEach((org)=>{
        selectHTML += '<option value="'+org.slug+'" '+(org.slug == selectedOrg ? 'selected' : '')+'>'+org.name+'</option>';
    });
    document.getElementById('orgs').innerHTML = selectHTML;
}

function buildAppList(appArray){
    let selectHTML = '';
    if(!selectedApp || selectedApp == ''){
        selectHTML += '<option value="" selected>All</option>';
    } else {
        selectHTML += '<option value="">All</option>';
    }
    appArray.forEach((app)=>{
        selectHTML += '<option value="'+app.slug+'" '+(app.slug == selectedApp ? 'selected' : '')+'>'+app.title+'</option>';
    });
    document.getElementById('apps').innerHTML = selectHTML;
}


