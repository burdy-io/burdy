import rimraf from 'rimraf';
import webpack from 'webpack';
import PathUtil from '@scripts/util/path.util';
import {compilerRun} from '@scripts/util/webpack.util';
import config from '@shared/features/config';
import {webpackServerConfigure} from '../webpack.config';
import {DbAction} from "@scripts/interfaces/db-actions";


const scriptDbActions = async (action: DbAction) => {
  const buildDirectory = PathUtil.cache('db-actions');

  await rimraf(buildDirectory, (error) => error && console.log(error));

  const webpackServerConfig = webpackServerConfigure((webpackConfig) => {
    webpackConfig.entry = PathUtil.root('scripts', 'entry', 'db-actions');
    webpackConfig.devtool = false;
    webpackConfig.output.path = buildDirectory;

    webpackConfig.plugins.push(new webpack.DefinePlugin({ action: JSON.stringify(action) }));

    return webpackConfig;
  }, config?.webpack?.server);

  const serverCompiler = webpack(webpackServerConfig);

  await compilerRun(serverCompiler);
}

export default scriptDbActions;
