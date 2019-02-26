/**
 * phanbug init
 * phanbug watch
 * phanbug break [file] [line_number] ([variable_to_inspect])//set a break point at a particular line in a file
 */
const actionMap = {};
actionMap.init = {
  help: 'Initialize phanbug.config.json',
  handler: () => {
    phanbug.init();
  }
};
actionMap.watch = {
  help: 'Watch source directory changes',
  handler: () => {
    phanbug.watch();
  }
};
actionMap.break = {
  help: 'Set a breakpoint at a particular line in a file (break [file] [line_number] ([variable_to_inspect]))',
  handler: () => {
    phanbug.setBreakPoint();
  }
};
actionMap.inspect = {
  help: 'Inspect particular file in a particular line (inspect [file] [line_number] ([variable_to_inspect]))',
  handler: () => {
    phanbug.inspect();
  }
};
actionMap.clear = {
  help: 'Clear all the breakpoints of a specific file (clear [file])',
  handler: () => {
    phanbug.clearBreakPoints();
  }
};

class Phanbug {
  constructor() {
    this.config = JSON.parse(fs.readFileSync('./phanbug.config.json').toString());
  }

  displayHelp() {
    console.log('Available commands:');
    Object.keys(actionMap).forEach(action => {
      console.log(`${action} - ${actionMap[action].help}`);
    });
  }

  displayHelpForAction(action) {
      console.log(`${action} - ${actionMap[action].help}`);
  }

  /**
   * initializing configuration
   */
  init() {
    //create the target directory and the source directory
    const mkdirTarget = execSync('mkdir -p ./target'); //synced directory
    const mkdirSource = execSync('mkdir -p ./source'); //version control directory
    if (mkdirTarget && mkdirSource) {
      const curDir = process.cwd();
      const phanbugConfig = {
        sourceDir: `${curDir}/source`,
        targetDir: `${curDir}/target`
      }
      fs.writeFileSync('./phanbug.config.json', JSON.stringify(phanbugConfig, null, 2));
    } else {
      console.log('Failed making the source and the target directory!');
    }
  }

  /**
   * watch the source directory and sync the files to the target directory
   */
  watch() {
    if (!fs.existsSync('./phanbug.config.json')) {
      console.log('phanbug.config.json does not exists!');
      process.exit(1);
    }

    console.log(`Watching file changes at directory ${this.config.sourceDir}`);
    fs.watch(this.config.sourceDir, () => {
      console.log(execSync(`rsync -arvh ${this.config.sourceDir}/ ${this.config.targetDir}`).toString());
    });
  }

  setBreakPoint() {
    if (args[3] === undefined || args[4] === undefined) {
      console.log('Missing file name and line number');
      this.displayHelpForAction('break');
      process.exit(1);
    }

    //for convenient, replace the "source/" in args[3]
    args[3] = args[3].replace('source/','');
    const targetFile = `${this.config.targetDir}/${args[3]}`;
    if (!fs.existsSync(targetFile)) {
      console.log(`${targetFile} does not exist!`);
      process.exit(1);
    }

    const lines = fs.readFileSync(targetFile).toString().split("\n");
    const numOfLines = lines.length;

    //first, remove all var_dumps in each line, thus clearing up all previous breakpoints
    const regex = /print_r(.*)exit;/gi;
    for (let i = 0; i < numOfLines; i++) {
      lines[i] = lines[i].replace(regex, '');
    }

    //now add the new breakpoint
    const lineNumber = parseInt(args[4]);

    if (args[5] ===  undefined) {
      lines[lineNumber - 1] += "print_r(get_defined_vars());exit;";
    } else {
      const variableToInspect = args[5];
      lines[lineNumber - 1] += `print_r($${variableToInspect});exit;`;
    }

    const newFileContent = lines.join("\n").trim();
    fs.writeFileSync(targetFile, newFileContent);

    //now run the target file
    console.log(execSync(`php ${targetFile}`).toString());
  }

  inspect() {
    if (args[3] === undefined || args[4] === undefined) {
      console.log('Missing file name and line number');
      this.displayHelpForAction('inspect');
      process.exit(1);
    }

    //for convenient, replace the "source/" in args[3]
    args[3] = args[3].replace('source/','');
    const targetFile = `${this.config.targetDir}/${args[3]}`;
    if (!fs.existsSync(targetFile)) {
      console.log(`${targetFile} does not exist!`);
      process.exit(1);
    }

    //first, sync up the files
    const cmd = `rsync -arvh ${this.config.sourceDir}/ ${this.config.targetDir}`;
    execSync(cmd);

    //now add the new breakpoint
    const lines = fs.readFileSync(targetFile).toString().split("\n");
    const numOfLines = lines.length;

    const lineNumber = parseInt(args[4]);

    if (args[5] ===  undefined) {
      lines[lineNumber - 1] += "print_r(get_defined_vars());exit;";
    } else {
      const variableToInspect = args[5];
      lines[lineNumber - 1] += `print_r($${variableToInspect});exit;`;
    }

    const newFileContent = lines.join("\n").trim();
    fs.writeFileSync(targetFile, newFileContent);

    //now run the target file
    console.log(execSync(`php ${targetFile}`).toString());

  }

  clearBreakPoints() {
    if (args[3] === undefined) {
      console.log('Missing file name');
      this.displayHelpForAction('clear');
      process.exit(1);
    }

    const targetFile = `${this.config.targetDir}/${args[3]}`;
    if (!fs.existsSync(targetFile)) {
      console.log(`${targetFile} does not exist!`);
      process.exit(1);
    }

    const lines = fs.readFileSync(targetFile).toString().split("\n");
    const numOfLines = lines.length;
    const regex = /print_r(.*)exit;/gi;
    for (let i = 0; i < numOfLines; i++) {
      lines[i] = lines[i].replace(regex, '');
    }

    const newFileContent = lines.join("\n").trim();
    fs.writeFileSync(targetFile, newFileContent);
  }
}

const fs = require('fs');
const args = process.argv;
const phanbug = new Phanbug();
const { execSync } = require('child_process');

if (args.length < 3) {
  phanbug.displayHelp();
} else {
  const action = args[2].toLowerCase();
  if (actionMap[action] !== undefined) {
    (actionMap[action].handler)();
  } else {
    console.log('Invalid phanbug command');
    phanbug.displayHelp();
  }
}
