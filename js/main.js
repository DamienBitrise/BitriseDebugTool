let modal = null;
let enableDiff = false;
window.onload = async function () {
  await loadEditor();
  populateStepSelect();
  addEventListeners();
//   hasAPIKey();
  //getAPIKey('password');
};

function populateStepSelect(){
  let stepNames = leftSteps.map((step)=>step.id);
  
  let selectHTML = '';
  if(!selectedStep || selectedStep == ''){
    selectHTML += '<option value="" selected>Full Log</option>';
  } else {
    selectHTML += '<option value="">Full Log</option>';
  }
  
  stepNames.forEach((step)=>{
      selectHTML += '<option value="'+step+'" '+(step == selectedStep ? 'selected' : '')+'>'+step+'</option>';
  });
  document.getElementById('steps').innerHTML = selectHTML;
}

function updateStep(stepName){
  selectedStep = stepName;
}

async function changeStep(inc){
  // Need to disable diff when changing step
  hideUnchanged = false;
  enableDiff = hideUnchanged;
  document.getElementById("remove_unchanged").checked = false;

  // Update selected step
  let selectElm = document.getElementById('steps');
  let index = parseInt(selectElm.selectedIndex);
  let options = Array.from(selectElm.childNodes);
  if(index+inc >= options.length){
    index = 0;
  } else if(index+inc < 0){
    index = options.length-1;
  } else {
    index+=inc;
  }
  selectedStep = index != 0 ? options[index].value : '';
  selectElm.selectedIndex = index;
  updateStep(selectedStep);

  diffEditor.dispose();
  await loadEditor();
}

async function bugFixForDiffOnlly(){
  // TODO: Figure out how to avoid this duplicate work,
  // Need to reenable diff only after the model is updated
  if(enableDiff){
    hideUnchanged = true;
    setTimeout(async ()=>{
      diffEditor.dispose();
      await loadEditor();
    }, 200);
  }
}
/* Event Listeners */

function addEventListeners(){
  var downloadElm = document.getElementById("download");
  downloadElm.addEventListener("click", function() {
    downloadAll();
  });

  var stepElm = document.getElementById("steps");
  stepElm.addEventListener("change", async function() {
    selectedStep = this.value;
    hideUnchanged = false;
    enableDiff = hideUnchanged;
    document.getElementById("remove_unchanged").checked = false;

    updateStep(selectedStep);
    diffEditor.dispose();
    await loadEditor();

    bugFixForDiffOnlly();
  });

  var timestampElm = document.getElementById("remove_timestamps");
  timestampElm.addEventListener("change", async function() {
    hideTimestamps = !this.checked;
    enableDiff = hideUnchanged;
    hideUnchanged = false;

    updateStep(selectedStep);
    diffEditor.dispose();
    await loadEditor();

    bugFixForDiffOnlly();
  });

  var uuidElm = document.getElementById("remove_uuids");
  uuidElm.addEventListener("change", async function() {
    hideUUIDs = !this.checked;
    hideUnchanged = false;

    updateStep(selectedStep);
    diffEditor.dispose();
    await loadEditor();

    bugFixForDiffOnlly();
  });

  var unchangedElm = document.getElementById("remove_unchanged");
  unchangedElm.addEventListener("change", async function() {
    hideUnchanged = this.checked;
    updateStep(selectedStep);
    diffEditor.dispose();
    await loadEditor();
  });

  var nextElm = document.getElementById("nextBtn");
  nextElm.addEventListener("click", function() {
    navi.next();
  });

  var prevElm = document.getElementById("prevBtn");
  prevElm.addEventListener("click", function() {
    navi.previous();
  });

  var nextElm = document.getElementById("stepNextBtn");
  nextElm.addEventListener("click", function() {
    changeStep(1);
  });

  var stepPrevElm = document.getElementById("stepPrevBtn");
  stepPrevElm.addEventListener("click", function() {
    changeStep(-1);
  });

  var loginBtn = document.getElementById("login");
  loginBtn.addEventListener("click", function() {
    modal = new Modal({
      el: document.getElementById('static-modal'),
      title: 'Login',
      // content: ''
    }).show();
  });

  /*var loginModalBtn = document.getElementById("loginBtn");
  loginModalBtn.addEventListener("click", function() {
    if(VAULT_STATE == 0){ // NO ACCOUNT
      let api_key = document.getElementById('signup_api_key').value;
      let password = document.getElementById('signup_password').value;
      if(password.length < 8){
        alert('Error your password must be at least 8 charecters long.');
      } else {
        saveAPIKey(password, api_key);
      }
    } else if(VAULT_STATE == 1){ // LOGGED OUT
      let password = document.getElementById('login_password').value;
      getAPIKey(password);
    } else if (VAULT_STATE == 2){ // LOGGED IN
      let api_key = document.getElementById('logged_in_api_key').value;
      let password = document.getElementById('logged_in_password').value;
      if(password.length < 8){
        alert('Error your password must be at least 8 charecters long.');
      } else {
        saveAPIKey(password, api_key);
      }
    }
  });

  var loginModalBtn = document.getElementById("deleteApiKeyBtn");
  loginModalBtn.addEventListener("click", function() {
    let text = "Are you sure you want to remove your API Key?\n\nYou will need to re-enter your API again if you proceed.";
    if (confirm(text) == true) {
      deleteAPIKey();
    } 
  });

  var logoutModalBtn = document.getElementById("logged_in_logout");
  logoutModalBtn.addEventListener("click", function() {
    let text = "Are you sure you want to log out?\n\nYour API Key is stored encrypted, you will need to unlock it with your password.";
    if (confirm(text) == true) {
      clearMemory();
    } 
  });

  var loginResetBtn = document.getElementById("login_reset");
  loginResetBtn.addEventListener("click", function() {
    let text = "Are you sure you want to reset?\n\nYou will need to re-enter your API again if you proceed.";
    if (confirm(text) == true) {
      deleteAPIKey();
    } 
  });*/

  var leftUrlElm = document.getElementById("left_url");
  leftUrlElm.addEventListener("input", async function() {
    let buildUrl = this.value;
    let parts = buildUrl.split('/');
    if(parts.length == 5){
      let buildSlug = parts[4];
      findAppSlug(buildSlug);
      // getBuild(buildSlug).then((res)=>{
      //   debugger;
      // }).catch((err)=>{
      //   console.log(err);
      // });
    }
  });

  var rightUrlElm = document.getElementById("right_url");
  rightUrlElm.addEventListener("input", async function() {
    
  });
  
}
