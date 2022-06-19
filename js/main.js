let modal = null;

window.onload = function () {
  loadEditor();
  // default_text = editor.getValue();

  addEventListeners();
};

function loadYaml(yamlObj){
    if(yamlObj.message){
      new Modal({
        el: document.getElementById('static-modal'),
        title: 'Error: '+yamlObj.reason,
        content: yamlObj.message.split('\n').join('<br>')
      }).show();
      document.getElementById('errors').innerHTML = 'Fix YAML Errors to load UI:<br><br>' + yamlObj.message.split('\n').join('<br>');
      return;
    } else if(!yamlObj.pipelines) {
      document.getElementById('errors').innerHTML = 'Fix YAML Errors to load UI:<br><br>No Pipelines Found!';
      return;
    } else if(!yamlObj.stages) {
      document.getElementById('errors').innerHTML = 'Fix YAML Errors to load UI:<br><br>No Stages Found!';
      return;
    } else {
      document.getElementById('errors').innerHTML = '';
    }
    let pipeline_keys = yamlObj.pipelines ? Object.keys(yamlObj.pipelines) : [];
    let workflow_keys = yamlObj.workflows ? Object.keys(yamlObj.workflows) : [];
    let newWorkflows = [];
    let removedWorkflows = [];
    if(!currentWorkflowKeys){
      currentWorkflowKeys = workflow_keys;
    } else if (!arraysEqual(currentWorkflowKeys, workflow_keys)){
      currentWorkflowKeys.forEach((workflow)=>{
        if(workflow_keys.indexOf(workflow) == -1){
          newWorkflows.push(workflow);
        }
      });
      workflow_keys.forEach((workflow)=>{
        if(currentWorkflowKeys.indexOf(workflow) == -1){
          removedWorkflows.push(workflow);
        }
      });
    }

    if(!selectedPipeline || pipeline_keys.indexOf(selectedPipeline) == -1){
      selectedPipeline = pipeline_keys[0];
    }
    let stage_keys = yamlObj.stages ? Object.keys(yamlObj.stages) : [];

    let selectHTML = '';
    pipeline_keys.forEach((pipeline)=>{
        selectHTML += '<option value="'+pipeline+'" '+(pipeline == selectedPipeline ? 'selected' : '')+'>'+pipeline+'</option>';
    });
    document.getElementById('pipelines').innerHTML = selectHTML;

    let boards = [];
    pipeline_keys.forEach((pipelineKey)=>{
      let pipeline = yamlObj.pipelines[pipelineKey];
      if(selectedPipeline == pipelineKey){
        if(!pipeline.stages){
          document.getElementById('errors').innerHTML += 'Invalid Pipeline "'+pipelineKey+'"!<br>';
          return;
        }
        let pipeline_stage_keys = pipeline.stages.map((stage)=>Object.keys(stage)[0]);
        pipeline_stage_keys.forEach((stage)=>{
            let stageObj = yamlObj.stages[stage];
            if(!stageObj){
              document.getElementById('errors').innerHTML += 'Stage "'+stage+'" Not Found!<br>';
              return;
            }
            let pipeline_stage_workflows = stageObj.workflows;
            let pipeline_stage_workflows_keys = pipeline_stage_workflows.map((stage)=>Object.keys(stage)[0]);
            // Update any workflows that have been renamed
            pipeline_stage_workflows_keys.forEach((workflow, i)=>{
              if(workflow_keys.indexOf(workflow) == -1){
                document.getElementById('errors').innerHTML += 'Workflow "'+workflow+'" in Stage "'+stage+'" in Pipeline "'+pipelineKey+'" Not Found!<br>';
                return;
              }
              let index = newWorkflows.indexOf(workflow);
              if(index != -1){
                pipeline_stage_workflows_keys[i] = removedWorkflows[index];
              }
            })
            let board_stages = [];
            pipeline_stage_workflows_keys.forEach((workflow, index)=>{
              let workflow_id = workflow + '|' + stage + '_' + index;
                board_stages.push({
                    id: workflow_id,
                    title: '<div class="workflow-title">'+workflow + '</div><div class="workflow-delete"><input id="delete_'+workflow_id+'" class="delete" type="button" value="X" onclick="deleteWorkflow(\''+workflow_id+'\')"></div>',
                    drag: function(el, source) {},
                    dragend: function(el) {},
                    drop: function(el) {
                        updateYamlFromBoard();
                    }
                });
            });
            boards.push({
                id: stage,
                title: stage + '<input id="delete_'+stage+'" class="delete" type="button" value="X" onclick="deleteStage(\''+stage+'\')">',
                class: "white",
                dragTo: stage_keys,
                item: board_stages
            }); 
        });
      } else {
        if(!pipeline.stages){
          document.getElementById('errors').innerHTML += 'Invalid Pipeline "'+pipelineKey+'"!<br>';
          return;
        }
        let pipeline_stage_keys = pipeline.stages.map((stage)=>Object.keys(stage)[0]);
        pipeline_stage_keys.forEach((stage)=>{
          let stageObj = yamlObj.stages[stage];
          if(!stageObj){
            document.getElementById('errors').innerHTML += 'Stage "'+stage+'" Not Found!<br>';
            return;
          }
          let pipeline_stage_workflows = stageObj.workflows;
          let pipeline_stage_workflows_keys = pipeline_stage_workflows.map((stage)=>Object.keys(stage)[0]);
          // Check the workflows for errors
          pipeline_stage_workflows_keys.forEach((workflow, i)=>{
            if(workflow_keys.indexOf(workflow) == -1){
              document.getElementById('errors').innerHTML += 'Workflow "'+workflow+'" in Stage "'+stage+'" in Pipeline "'+pipelineKey+'" Not Found!<br>';
              return;
            }
          })
        });
      }
    })
    createBoard(boards, yamlObj);
}

/* YAML Functions */

function parseYaml() {
  var str, obj;

  str = editor.getValue();

  try {
    obj = jsYaml.load(str, { schema: jsYaml.DEFAULT_SCHEMA });
  } catch (err) {
    console.log(err);
    return err;
  }
  return obj;
}

/* Event Listeners */

function addEventListeners(){
  // editor.getModel().onDidChangeContent((event) => {
  //   loadYaml(parseYaml());
  // });

  var downloadElm = document.getElementById("download");
  downloadElm.addEventListener("click", function() {
    download();
  });
}