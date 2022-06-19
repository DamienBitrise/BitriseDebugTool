let modal = null;
window.onload = async function () {
  await loadEditor();
  populateStepSelect();
  addEventListeners();
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

/* Event Listeners */

function addEventListeners(){
  var downloadElm = document.getElementById("download");
  downloadElm.addEventListener("click", function() {
    downloadAll();
  });

  var stepElm = document.getElementById("steps");
  stepElm.addEventListener("change", async function() {
    selectedStep = this.value;
    document.getElementById("remove_unchanged").checked = false;
    hideUnchanged = false;

    updateStep(selectedStep);
    diffEditor.dispose();
    await loadEditor();
  });

  var timestampElm = document.getElementById("remove_timestamps");
  timestampElm.addEventListener("change", async function() {
    hideTimestamps = !this.checked;
    document.getElementById("remove_unchanged").checked = false;
    hideUnchanged = false;
    updateStep(selectedStep);
    diffEditor.dispose();
    await loadEditor();
  });

  var uuidElm = document.getElementById("remove_uuids");
  uuidElm.addEventListener("change", async function() {
    hideUUIDs = !this.checked;
    document.getElementById("remove_unchanged").checked = false;
    hideUnchanged = false;
    updateStep(selectedStep);
    diffEditor.dispose();
    await loadEditor();
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
}