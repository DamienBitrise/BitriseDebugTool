let originalModel =null;
let modifiedModel = null;
let resizeTimeout = null;
let diffEditor = null;
let left = null;
let right = null;
let leftRanges = null;
let rightRanges = null;

const ansiStartRegex = /\[\d{2}(m|;1m)/g;
const ansiEndRegex = /\[\d{2}(m|;1m)((.|\n)*?)\[0m/g;
const ansiNewLineRegex = /\[\d{2}(m|;1m)\n/g;
const ansiNewLineEndRegex = /\n\[0m/g;
const ansiBadRegexs = [
  /\[38;\d;\d{2,3}m/g,
  /\[38;\d;\d{2,3};\d{2}m/g,
  /\[39(m|;1m)/g
];
const ansiEscapeRegexs = [
  //g
];
const ansiRegexs = [
  /\[\d{2}(m|;1m)/g,
  /\[0m/g
];
const timeStampRegexs = [
  /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z/g,
  /(\d{2}):(\d{2}):(\d{2})/g,
];
const slugRegexs = [
  /[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}/g
];
async function loadEditor(){
  // The diff editor offers a navigator to jump between changes. Once the diff is computed the <em>next()</em> and <em>previous()</em> method allow navigation. By default setting the selection in the editor manually resets the navigation state.
  if(!left && !right){
    left = await getText('/logs/success.txt');
    right = await getText('/logs/failure.txt');
  }

  left = processRegexs(ansiEscapeRegexs, left, '');
  left = processRegexs(timeStampRegexs, left, '[DATE/TIME REPLACED]');
  left = processRegexs(slugRegexs, left, '[BUILD SLUG REPLACED]');
  left = fixCodeBlocks(left);
  left = fixNewLineIssue(left);
  left = fixNewLineEndIssue(left);

  right = processRegexs(ansiEscapeRegexs, right, '');
  right = processRegexs(timeStampRegexs, right, '[DATE/TIME REPLACED]');
  right = processRegexs(slugRegexs, right, '[BUILD SLUG REPLACED]');
  right = fixCodeBlocks(right);
  right = fixNewLineIssue(right);
  right = fixNewLineEndIssue(right);

  // Replace Escape Codes and remove the [32m ansi color codes
  let leftLinesUnmodified = left.split('\n');
  let rightLinesUnmodified = right.split('\n');

  // Get the [32m ansi color positions
  let leftStarts = left.match(ansiStartRegex);
  let leftMatches = left.match(ansiEndRegex);

  let rightStarts = right.match(ansiStartRegex);
  let rightMatches = right.match(ansiEndRegex);

  left = processRegexs(ansiRegexs, left, '');
  
  let leftLines = left.split('\n');

  right = processRegexs(ansiRegexs, right, '');
  let rightLines = right.split('\n');

  leftRanges = [];
  rightRanges = [];
  
  let currentLine = 0;
  // debugger;
  for(let i=0; i<leftMatches.length; i++){
    let color = 'ansi_'+leftStarts[i].replace('[', '').replace(';1m', 'm1m');
    // Replace text with colors
    for(let j = currentLine; j < leftLinesUnmodified.length; j++){
      let indexStart = leftLinesUnmodified[j].indexOf(leftMatches[i]);
      if(indexStart != -1){
        // Remove the ansi codes now we found it
        leftMatches[i] = processRegexs(ansiRegexs, leftMatches[i], '');
        // update the start index without the ansi codes
        indexStart = leftLines[j].indexOf(leftMatches[i]);
        let indexEnd = indexStart + leftMatches[i].length + 1;
        leftRanges.push({
          range: new monaco.Range(j+1, indexStart, j+1, indexEnd),
          options: { inlineClassName: color }
        });
        currentLine = j;
        break;
      }
    }
  }
  currentLine = 0;
  for(let i=0; i<rightMatches.length; i++){
    let color = 'ansi_'+rightStarts[i].replace('[', '').replace(';1m', 'm1m');
    let expandedmatches = [rightMatches[i]];
    if(rightMatches[i].indexOf('\n') != -1){
      expandedmatches = rightMatches[i].split('\n');
      // debugger;
    }
    expandedmatches.forEach((match, index)=>{
      // Replace text with colors
      for(let j = currentLine; j < rightLinesUnmodified.length; j++){
        let indexStart = rightLinesUnmodified[j].indexOf(match);
        if(indexStart != -1){
          // Remove the ansi codes now we found it
          match = processRegexs(ansiRegexs, match, '');
          if(match != ''){
            // update the start index without the ansi codes
            indexStart = rightLines[j].indexOf(match);
            let indexEnd = indexStart + match.length + 1;
            rightRanges.push({
              range: new monaco.Range(j+1, indexStart, j+1, indexEnd),
              options: { inlineClassName: color }
            });
          }
          currentLine = j;
          break;
        }
      }
    })
  }
  
  createEditor();

  window.onresize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  };
}

function fixCodeBlocks(text){
  ansiBadRegexs.forEach((regex)=>{
    text = text.replace(regex, '');
  });
  return text;
}

function fixNewLineIssue(text){
  let lines = text.split('\n');
  let matches = text.match(ansiNewLineRegex);
  let currentLine = 0;
  let linesToMerge = [];
  if(matches){
    for(let i = 0; i < matches.length; i++){
      for(let j = currentLine; j < lines.length; j++){
        let indexStart = lines[j].indexOf(matches[i].substring(0, matches[i].length-2));
        if(indexStart != -1){
          linesToMerge.push(j);
          currentLine = j+1;
          break;
        }
      }
    }
    let offset = 0;
    linesToMerge.forEach((index)=>{
      lines.splice(index, 2, lines[index+offset]+lines[index+offset+1]);
      offset--;
    });
  }
  return lines.join('\n');
}

function fixNewLineEndIssue(text){
  let lines = text.split('\n');
  let matches = text.match(ansiNewLineEndRegex);
  let currentLine = 0;
  let linesToMerge = [];
  if(matches){
    for(let i = 0; i < matches.length; i++){
      for(let j = currentLine; j < lines.length; j++){
        if(lines[j] == matches[i].substring(2, matches[i].length)){
          linesToMerge.push(j);
          currentLine = j+1;
          break;
        }
      }
    }
    let offset = 0;
    linesToMerge.forEach((index)=>{
      lines.splice(index-1, 2, lines[index+offset-1]+lines[index+offset]);
      offset--;
    });
  }
  return lines.join('\n');
}

function processRegexs(regexs, text, replacement){
  regexs.forEach((regEx)=>{
    text = text.replace(regEx, replacement);
  });
  return text;
}

function getLineNumber(lines, string){
  for(let i = 0; i < lines.length; i++){
    if(lines[i].indexOf(string) != -1){
      return i+1;
    }
  }
}

function createEditor(){
    originalModel = monaco.editor.createModel(left);
    modifiedModel = monaco.editor.createModel(right);

    diffEditor = monaco.editor.createDiffEditor(document.getElementById('container'));
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
      ignoreTrimWhitespace: true
    });

    window.editor = monaco.editor.createDiffNavigator(diffEditor, {
      automaticLayout: true,
      enableSplitViewResizing: true,
      followsCaret: true, // resets the navigator state when the user selects something in the editor
      ignoreCharChanges: true,  // jump from line to line
    });
    monaco.editor.setTheme('vs-dark');
    originalModel.deltaDecorations(
      [],
      leftRanges
    );
    modifiedModel.deltaDecorations(
      [],
      rightRanges
    );
}

function resize(){
  var oldViewState = diffEditor.saveViewState();
  diffEditor.dispose();
  diffEditor = monaco.editor.createDiffEditor(document.getElementById('container'));
  diffEditor.setModel({
    original: originalModel,
    modified: modifiedModel,
    ignoreTrimWhitespace: true
  });
  diffEditor.restoreViewState(oldViewState);
}