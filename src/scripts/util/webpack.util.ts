import path from 'path';
import webpack from 'webpack';
import { Express } from 'express';
import PathUtil from '@scripts/util/path.util';
import ReactRefreshPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { webpackAdminConfigure } from '../../webpack.config';

const compilerRun = (compiler: webpack.Compiler) => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }
      return resolve(stats);
    });
  });
};

const attachWebpackMiddleware = async (app: Express) => {
  const publicPath = '/admin';
  const hmrPath = `${publicPath}/__webpack_hmr`;

  const webpackConfig = webpackAdminConfigure((wpConfig) => {
    wpConfig.entry = [
      PathUtil.admin('index'),
      `webpack-hot-middleware/client?path=${hmrPath}`,
    ];

    wpConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
    wpConfig.plugins.push(new ReactRefreshPlugin());

    return wpConfig;
  });

  const compiler = webpack(webpackConfig);
  const devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
  });

  app.use(devMiddleware);
  app.use(
    require('webpack-hot-middleware')(compiler, {
      path: hmrPath,
    })
  );

  app.get(['/admin/*', '/admin'], (req, res) => {
    const index = devMiddleware.context.outputFileSystem.readFileSync(
      path.join(webpackConfig.output.path, 'index.html')
    );
    res.end(index);
  });

  return devMiddleware;
};

export { compilerRun, attachWebpackMiddleware };
