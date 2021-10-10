import PathUtil from "@scripts/util/path.util";
import rimraf from "rimraf";
import {webpackServerConfigure} from "../webpack.config";
import config from "@shared/features/config";
import webpack from "webpack";
import {compilerRun} from "@scripts/util/webpack.util";
import glob from 'fast-glob';


const scriptContentTypes = async (subcommand = 'export', pattern: string[] = []) => {
  const ctBuildDirectory = PathUtil.cache('ct-build');

  await rimraf(ctBuildDirectory, (error) => error && console.log(error));

  if (pattern.length === 0) {
    pattern = [
      'components/**/*.ts',
      'components/**/*.tsx',
      'components/**/*.js',
      'components/**/*.jsx',
      'templates/**/*.ts',
      'templates/**/*.tsx',
      'templates/**/*.js',
      'templates/**/*.jsx',
    ]
  }

  console.log('Scanning with: ', pattern.join(' '), ' patterns.');

  const componentFiles = await glob(pattern);

  const requireStatements = componentFiles.map(file => (
    `{ require: () => require('${process.cwd()}/${file}'), file: '${file}' }`
  )).join(',')

  const webpackServerConfig = webpackServerConfigure((webpackConfig) => {
    webpackConfig.entry = PathUtil.root('scripts', 'entry', 'content-types');
    webpackConfig.devtool = false;
    webpackConfig.output.path = ctBuildDirectory;
    webpackConfig.plugins.push(
      new webpack.DefinePlugin({
        REQUIRE_STATEMENTS: `[${requireStatements}]`,
        COMMAND: JSON.stringify(subcommand)
      })
    )
    return webpackConfig;
  }, config?.webpack?.server);

  const serverCompiler = webpack(webpackServerConfig);
  await compilerRun(serverCompiler);
}

export default scriptContentTypes;
