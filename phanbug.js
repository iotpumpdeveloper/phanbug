class Phanbug {
  displayHelp() {
    console.log('This is phanbug command line helping');
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

    const config = JSON.parse(fs.readFileSync('./phanbug.config.json').toString());
    fs.watch(config.sourceDir, () => {
      const { execSync } = require('child_process');
      console.log(execSync(`rsync -arvh ${config.sourceDir}/ ${config.targetDir}`).toString());
    });
  }
}

const fs = require('fs');
const args = process.argv;
/*const config = JSON.parse(fs.readFileSync('./phanbug.config.json').toString());*/
const phanbug = new Phanbug();

if (args.length < 3) {
  phanbug.displayHelp();
} else {
  const action = args[2].toLowerCase();
  const actionMap = {
    'init': () => {
      phanbug.init();
    },
    'watch': () => {
      phanbug.watch();
    }
  }
  if (actionMap[action] !== undefined) {
    actionMap[action]();
  } else {
    console.log('Invalid phanbug command');
    phanbug.displayHelp();
  }
}
