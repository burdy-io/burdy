import chalk from 'chalk';

const ConsoleOutput = {
  success: (...output: any[]) => console.log(chalk.green('[Success]'), ...output),
  error: (...output: any[]) => console.log(chalk.red('[Error]'), ...output),
  info: (...output: any[]) => console.log(chalk.blue('[Info]'), ...output),
};

export default ConsoleOutput;
