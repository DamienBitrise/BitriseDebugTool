let modal = null;
let selectedStep = null;
window.onload = async function () {
  await loadEditor();
  
  leftSteps = getSteps(leftOriginal);
  rightSteps = getSteps(rightOriginal);

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
  leftSteps = getSteps(leftOriginal);
  rightSteps = getSteps(rightOriginal);
  let leftStep = leftSteps.find((step)=>step.id == stepName);
  let rightStep = rightSteps.find((step)=>step.id == stepName);
  if(stepName){
    rebuild(leftStep.lines.join('\n'), rightStep.lines.join('\n'));
  } else {
    rebuild(leftOriginal, rightOriginal);
  }
}

/* Event Listeners */

function addEventListeners(){
  var downloadElm = document.getElementById("download");
  downloadElm.addEventListener("click", function() {
    download();
  });

  var stepElm = document.getElementById("steps");
  stepElm.addEventListener("change", function() {
    selectedStep = this.value;
    updateStep(selectedStep);
  });
}