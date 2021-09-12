import rimraf from 'rimraf';
import webpack from 'webpack';
import PathUtil from '@scripts/util/path.util';
import {compilerRun} from '@scripts/util/webpack.util';
import config from '@shared/features/config';
import {notify} from '@scripts/util/notifier.util';
import {
  webpackAdminConfigure,
  webpackServerConfigure,
} from '../webpack.config';

const scriptBuild = async () => {
  const serverBuildDirectory = PathUtil.build();

  await rimraf(serverBuildDirectory, (error) => error && console.log(error));

  const webpackServerConfig = webpackServerConfigure((webpackConfig) => {
    webpackConfig.entry = PathUtil.root('scripts', 'entry', 'build');
    return webpackConfig;
  }, config?.webpack?.server);

  const serverCompiler = webpack(webpackServerConfig);

  const webpackAdminConfig = webpackAdminConfigure((webpackConfig) => {
    webpackConfig.entry = PathUtil.admin('index');
    webpackConfig.output.path = PathUtil.build('admin');

    return webpackConfig;
  });

  const adminCompiler = webpack(webpackAdminConfig);

  await Promise.all([compilerRun(serverCompiler), compilerRun(adminCompiler)]);

  notify({
    subtitle: 'Built Successfully',
    message: 'Your build has been compiled.',
  });
};

export default scriptBuild;
