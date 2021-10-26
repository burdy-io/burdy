import rimraf from 'rimraf';
import webpack from 'webpack';
import PathUtil from '@scripts/util/path.util';
import {compilerRun} from '@scripts/util/webpack.util';
import config from '@shared/features/config';
import {webpackServerConfigure} from '../webpack.config';

const scriptImportExport = async ({action = 'import', output = 'hello.zip', force = true}) => {
  const buildDirectory = PathUtil.cache('import-export');

  await rimraf(buildDirectory, (error) => error && console.log(error));

  const webpackServerConfig = webpackServerConfigure((webpackConfig) => {
    webpackConfig.entry = PathUtil.root('scripts', 'entry', 'import-export');
    webpackConfig.devtool = false;
    webpackConfig.output.path = buildDirectory;

    webpackConfig.plugins.push(
      new webpack.DefinePlugin({
        ACTION: JSON.stringify(action),
        OUTPUT: JSON.stringify(output),
        FORCE: JSON.stringify(force)
      })
    );

    return webpackConfig;
  }, config?.webpack?.server);

  const serverCompiler = webpack(webpackServerConfig);

  await compilerRun(serverCompiler);
}

export default scriptImportExport;
