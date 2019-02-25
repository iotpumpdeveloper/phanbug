/**
 * phanbug init
 * phanbug watch
 * phanbug break [file] [linenumber] //set a break point at a particular line in a file
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
  help: 'Set a breakpoint at a particular line in a file (break [file] [linenumber])',
  handler: () => {
    phanbug.setBreakPoint();
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
    const { execSync } = require('child_process');
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
      const { execSync } = require('child_process');
      console.log(execSync(`rsync -arvh ${this.config.sourceDir}/ ${this.config.targetDir}`).toString());
    });
  }

  setBreakPoint() {
    if (args[3] === undefined || args[4] === undefined) {
      console.log('Missing file name and line number');
      this.displayHelpForAction('break');
      process.exit(1);
    }

    const targetFile = `${this.config.targetDir}/${args[3]}`;
    if (!fs.existsSync(targetFile)) {
      console.log(`${targetFile} does not exist!`);
      process.exit(1);
    }

    const lines = fs.readFileSync(targetFile).toString().split("\n");
    const lineNumber = parseInt(args[4]);
    lines[lineNumber - 1] += "var_dump(get_defined_vars());exit;";

    const newFileContent = lines.join("\n").trim();
    console.log(newFileContent);
  }
}

const fs = require('fs');
const args = process.argv;
const phanbug = new Phanbug();

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
