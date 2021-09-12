import PathUtil from '@scripts/util/path.util';
import config from '@shared/features/config';
import webpack from 'webpack';
import WebpackShellPlugin from 'webpack-shell-plugin-next';
import express from 'express';
import { attachWebpackMiddleware } from '@scripts/util/webpack.util';
import { webpackServerConfigure } from '../webpack.config';

const scriptDev = async () => {
  const webpackServerConfig = webpackServerConfigure((webpackConfig) => {
    webpackConfig.entry = PathUtil.root('scripts', 'entry', 'dev');
    webpackConfig.output.path = PathUtil.devBuild();
    webpackConfig.plugins.push(
      new WebpackShellPlugin({
        onBuildEnd: {
          scripts: [
            `cross-env ADMIN_PATH="${PathUtil.admin()}" nodemon -q --watch ${PathUtil.devBuild()} ${PathUtil.devBuild(
              'main'
            )}`,
          ],
          parallel: true,
          blocking: false,
        },
      })
    );
    return webpackConfig;
  }, config?.webpack?.admin);

  const compiler = webpack(webpackServerConfig);
  compiler.watch(
    {
      aggregateTimeout: 300,
    },
    () => {}
  );

  const app = express();
  await attachWebpackMiddleware(app);

  app.listen(process.env.ADMIN_PORT).on('error', (e) => {
    console.log(e);
    console.log('error occurred');
  });
}

export default scriptDev;
