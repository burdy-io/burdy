import rimraf from 'rimraf';
import webpack from 'webpack';
import PathUtil from '@scripts/util/path.util';
import {compilerRun} from '@scripts/util/webpack.util';
import config from '@shared/features/config';
import {webpackServerConfigure} from '../webpack.config';

const scriptDbCliBuild = async () => {
  const dbBuildDirectory = PathUtil.cache('db-build');

  await rimraf(dbBuildDirectory, (error) => error && console.log(error));

  const webpackServerConfig = webpackServerConfigure((webpackConfig) => {
    webpackConfig.entry = PathUtil.root('scripts', 'entry', 'db-cli');
    webpackConfig.devtool = false;
    webpackConfig.output.path = dbBuildDirectory;
    return webpackConfig;
  }, config?.webpack?.server);

  const serverCompiler = webpack(webpackServerConfig);

  await compilerRun(serverCompiler);
}

export default scriptDbCliBuild;
