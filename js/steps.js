let startStep = '| (';
let endStep  = '| [32;1m✓[0m |';
let endStep2 = '| [32;1m✓[0m |';
let endStep3 = '| [31;1mx[0m |';
let stepId = '| id: ';
let startSummary = '|                               bitrise summary                                |';
let endSummary = '| Total runtime:';

function getSteps(log){
    let lines = log.split('\n');
    let parsingStep = false;
    let steps = [];
    let stepLines = ['+------------------------------------------------------------------------------+'];
    let stepName = '';
    let parsingSummary = false;
    let finished = false;
    lines.forEach((line)=>{
        if(line.indexOf(startSummary) != -1){
            parsingSummary = true;
        } else if(line.indexOf(endSummary) != -1) {
            finished = true;
        }
        if(!parsingSummary){
            if(line.indexOf(startStep) != -1){
                parsingStep = true;
            } else if (line.indexOf(endStep) != -1 || line.indexOf(endStep2) != -1 || line.indexOf(endStep3) != -1){
                parsingStep = false;
                stepLines.push(line);
                steps.push({
                    id: stepName,
                    lines: stepLines
                });
                stepLines = ['+------------------------------------------------------------------------------+'];
                parsingSummary = false;
                finished = false;
            }
            if(parsingStep){
                let index = line.indexOf(stepId);
                if(index != -1){
                    stepName = line.substring(stepId.length, line.length-2).trim();
                }
                stepLines.push(line);
            }
        }
    });
    return steps;
  }