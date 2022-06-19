let startStep = '| (';
let endStep  = '| [32;1m✓[0m |';
let endStep2 = '| [32;1m✓[0m |';
let endStep3 = '| [31;1mx[0m |';
let stepId = '| id: ';
let startSummary = '|                               bitrise summary                                |';
let endSummary = '| Total runtime:';
let skipSummary = '| Issue tracker:';
let skipSummary2 = '| Source:';
let stepWrapper = '+------------------------------------------------------------------------------+';

function getSteps(log){
    let lines = log.split('\n');
    let parsingStep = false;
    let steps = [];
    let stepLines = [stepWrapper];
    let stepName = '';
    let parsingSummary = false;
    let finished = false;
    lines.forEach((line)=>{
        if(line.indexOf(startSummary) != -1){
            parsingSummary = true;
            stepName = 'Summary';
        } else if(line.indexOf(endSummary) != -1) {
            finished = true;
            stepLines.push(line);
            stepLines.push(stepWrapper);
            steps.push({
                id: stepName,
                lines: stepLines
            });
            stepLines = [stepWrapper];
            parsingSummary = false;
        }
        if(!parsingSummary){
            if(line.indexOf(startStep) != -1){
                parsingStep = true;
            } else if (line.indexOf(endStep) != -1 || line.indexOf(endStep2) != -1 || line.indexOf(endStep3) != -1){
                parsingStep = false;
                stepLines.push(line);
                stepLines.push(stepWrapper);
                steps.push({
                    id: stepName,
                    lines: stepLines
                });
                stepLines = [stepWrapper];
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
        } else if (!finished){
            if(line.indexOf(skipSummary) == -1 && line.indexOf(skipSummary2) == -1){
                stepLines.push(line);
            } 
            if(line.indexOf(skipSummary2) != -1 ){
                stepLines.pop();
            }
        }
    });
    return steps;
  }