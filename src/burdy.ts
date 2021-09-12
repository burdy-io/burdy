#!/usr/bin/env node
import chalk from 'chalk';
import {Command} from 'commander';
import fs from 'fs-extra';
import packageJSON from '../package.json';
import PathUtil from "@scripts/util/path.util";
import ConsoleOutput from "@scripts/util/console-output.util";
import path from 'path';

const program = new Command();

const start = async () => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';
  const scriptPath = PathUtil.build('main.js');
  const scriptExists = await fs.pathExists(scriptPath);

  if (!scriptExists) {
    ConsoleOutput.error(`Build has not been found. Try running ${chalk.magentaBright('burdy build')} before.`)
    process.exit(1);
  }

  require(scriptPath);
};

const build = async () => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';
  await require('@scripts/build').default();
};

const dev = async () => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
  await require('@scripts/dev').default();
}

const db = async () => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
  process.env.TYPEORM_MIGRATIONS = process.env.TYPEORM_MIGRATIONS ?? path.join('burdy', 'migrations', '*.[tj]s');
  process.env.TYPEORM_MIGRATIONS_DIR = process.env.TYPEORM_MIGRATIONS_DIR ?? path.join('burdy', 'migrations');

  const dbScriptPath = PathUtil.cache('db-build', 'main.js');
  await require('@scripts/db-cli').default();

  process.argv.splice(2, 1);
  process.argv[1] = 'burdy db'
  if (process.argv[2] === 'migration:generate') {
    process.argv.push('-o');
  }

  require(dbScriptPath);
}

// Initial program setup
program.storeOptionsAsProperties(false).allowUnknownOption(true);

program.helpOption('-h, --help', 'Display help for command');
program.addHelpCommand('help [command]', 'Display help for command');

// `$ burdy version` (--version synonym)
program.version(
  packageJSON.version,
  '-v, --version',
  'Output the version number'
);

program
.command('version')
.description('Output your version of Burdy')
.action(() => {
  process.stdout.write(`${packageJSON.version}\n`);
  process.exit(0);
});

program.command('start').description('Start your Burdy application').action(start);
program.command('build').description('Build your Burdy application').action(build);
program.command('dev').description('Develop your Burdy server').action(dev);
program.command('db').allowUnknownOption(true).helpOption(false).description('Run TypeORM commands').action(db);

program.parseAsync(process.argv);
