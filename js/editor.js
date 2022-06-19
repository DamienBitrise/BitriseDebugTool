// Monaco Editor Objects
let diffEditor = null;
let originalModel =null;
let modifiedModel = null;
let navi = null;
// Log Storage for parsing
let left = null;
let leftOriginal = null;
let right = null;
let rightOriginal = null;
// Ranges
let leftRanges = null;
let rightRanges = null;
// Step log override
let leftOverride = null;
let rightOverride = null;
// Resive handler timeout
let resizeTimeout = null;
// Settings
let hideTimestamps = true;
let hideUUIDs = true;
let hideUnchanged = false;
let selectedStep = null;
// Parsed Steps
let leftSteps = [];
let rightSteps = [];

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
    // Local Debugging
    // leftOriginal = await getText('/logs/success.txt');
    // rightOriginal = await getText('/logs/failure.txt');
    // Production
    leftOriginal = await getText('https://damienbitrise.github.io/BitriseDebugTool/logs/success.txt');
    rightOriginal = await getText('https://damienbitrise.github.io/BitriseDebugTool/logs/failure.txt');
    left = '' + leftOriginal;
    right = '' + rightOriginal;
    leftSteps = getSteps(left);
    rightSteps = getSteps(right);
  } else {
    left = '' + leftOriginal;
    right = '' + rightOriginal;
    leftSteps = getSteps(left);
    rightSteps = getSteps(right);
  }
  if(selectedStep){
    let leftStep = leftSteps.find((step)=>step.id == selectedStep);
    let rightStep = rightSteps.find((step)=>step.id == selectedStep);
    leftOverride = leftStep.lines.join('\n');
    rightOverride = rightStep.lines.join('\n');
  } else {
    leftOverride = null;
    rightOverride = null;
  }
  if(leftOverride && rightOverride){
    left = '' + leftOverride;
    right = '' + rightOverride;
  }

  if(hideTimestamps){
    left = processRegexs(timeStampRegexs, left, '<DATE/TIME>');
    right = processRegexs(timeStampRegexs, right, '<DATE/TIME>');
  }
  if(hideUUIDs){
    left = processRegexs(slugRegexs, left, '<UUID>');
    right = processRegexs(slugRegexs, right, '<UUID>');
  }

  // Clean up the log
  left = processRegexs(ansiEscapeRegexs, left, '');
  left = fixCodeBlocks(left);
  left = fixNewLineIssue(left);
  left = fixNewLineEndIssue(left);

  right = processRegexs(ansiEscapeRegexs, right, '');
  right = fixCodeBlocks(right);
  right = fixNewLineIssue(right);
  right = fixNewLineEndIssue(right);

  // Replace Escape Codes and remove the [32m ansi color codes
  let leftLinesUnmodified = left.split('\n');
  let rightLinesUnmodified = right.split('\n');

  // Get the [32m ansi color positions
  let leftMatches = left.match(ansiEndRegex);
  let rightMatches = right.match(ansiEndRegex);

  left = processRegexs(ansiRegexs, left, '');
  
  let leftLines = left.split('\n');

  right = processRegexs(ansiRegexs, right, '');
  let rightLines = right.split('\n');

  if(hideUnchanged){
    let changes = hideUnchangedLines(leftOverride ? leftOverride : left, rightOverride ? rightOverride : right);
    left = changes[0];
    right = changes[1];
  }

  if(leftMatches && rightMatches){
    leftRanges = getRanges(leftLines, leftLinesUnmodified, leftMatches, leftRanges);
    rightRanges = getRanges(rightLines, rightLinesUnmodified, rightMatches, rightRanges);
  } else {
    console.log('No matches found!');
  }
 
  createEditor();

  window.onresize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  };
}

function hideUnchangedLines(leftText, rightText){
  let left = leftText.split('\n');
  let right = rightText.split('\n');
  let lineChanges = diffEditor.getLineChanges(); 
  console.log(lineChanges);
  let leftLines = [];
  let rightLines = [];
  lineChanges.forEach((line)=>{
    let ls = line.originalStartLineNumber;
    let le = line.originalEndLineNumber;
    for(let i = ls; i <= le+1; i++){
      if(right[i-1] != '' && right[i-1] != '\n'){
        leftLines.push(left[i-1]);
      }
    }
    let rs = line.modifiedStartLineNumber;
    let re = line.modifiedEndLineNumber;
    for(let i = rs; i <= re+1; i++){
      if(right[i-1] != '' && right[i-1] != '\n'){
        rightLines.push(right[i-1]);
      }
    }
  });

  return [leftLines.join('\n'), rightLines.join('\n')];
}

function getRanges(lines, unmodifiedLines, matches){
  let ranges = [];
  let currentLine = 0;
  for(let i=0; i<matches.length; i++){
    let ansiColor = matches[i].match(ansiStartRegex);
    let color = 'ansi_'+ansiColor[0].replace('[', '').replace(';1m', 'm1m');
    let expandedmatches = [matches[i]];

    // Handle multi line asci coloring
    if(matches[i].indexOf('\n') != -1){
      expandedmatches = matches[i].split('\n');
    }
    
    expandedmatches.forEach((match)=>{
      // Replace text with colors
      for(let j = currentLine; j < unmodifiedLines.length; j++){
        let indexStart = unmodifiedLines[j].indexOf(match);
        if(indexStart != -1){
          // Remove the ansi codes now we found it
          match = processRegexs(ansiRegexs, match, '');
          if(match != ''){
            // update the start index without the ansi codes
            indexStart = lines[j].indexOf(match);
            let indexEnd = indexStart + match.length + 1;
            ranges.push({
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
  return ranges;
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
      let expandedmatches = [matches[i]];
      if(matches[i].indexOf('\n') != -1){
        expandedmatches = matches[i].split('\n');
      }
      expandedmatches.forEach((match)=>{
        if(match != ''){
          for(let j = currentLine; j < lines.length; j++){
            if(lines[j] == match.substring(2, match.length)){
              linesToMerge.push(j);
              currentLine = j+1;
              break;
            }
          }
        }
      });
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

function downloadAll(){
  let filenames = [
    'LEFT_apps_0285f0566059b103_de0da46c-fecf-40ad-a327-45ddb9860999-full.txt',
    'RIGHT_apps_0285f0566059b103_b1080108-3ba5-4525-95b0-41b0d1687b05-full.txt'
  ];

  download(filenames[0], leftOriginal);
  download(filenames[1], rightOriginal);
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL) {
      // No need to add the download element to the DOM in Webkit.
      downloadLink.href = window.webkitURL.createObjectURL(blob);
  } else {
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.onclick = (event) => {
          if (event.target) {
              document.body.removeChild(event.target);
          }
      };
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
  }

  downloadLink.click();

  if (window.webkitURL) {
      window.webkitURL.revokeObjectURL(downloadLink.href);
  } else {
      window.URL.revokeObjectURL(downloadLink.href);
  }
};

function createEditor(){
    originalModel = monaco.editor.createModel(left);
    modifiedModel = monaco.editor.createModel(right);

    diffEditor = monaco.editor.createDiffEditor(document.getElementById('container'));
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
      ignoreTrimWhitespace: true
    });

    navi = monaco.editor.createDiffNavigator(diffEditor, {
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
