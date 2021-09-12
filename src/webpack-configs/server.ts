import webpack from 'webpack';
import WebpackBar from 'webpackbar';
import PathUtil from '@scripts/util/path.util';
import nodeExternals from 'webpack-node-externals';
import FriendlyErrorsWebpackPlugin from '@soda/friendly-errors-webpack-plugin';
import { notify } from '@scripts/util/notifier.util';

const isProduction = process.env.NODE_ENV === 'production';

const ShowErrorsPlugin = new FriendlyErrorsWebpackPlugin({
  onErrors: (severity, errors) => {
    if (severity !== 'error') {
      return;
    }

    const [error] = errors;
    notify({ subtitle: 'Server Webpack - Error', message: error.name });
  },
  clearConsole: false,
  compilationSuccessInfo: { messages: [], notes: [] },
});

ShowErrorsPlugin.displaySuccess = () => {};

const serverDefaultWebpack: any = {
  mode: isProduction ? 'production' : 'development',
  bail: false,
  performance: {
    hints: false,
  },
  target: 'node',
  devtool: isProduction ? false : 'cheap-module-source-map',
  externals: [nodeExternals({ allowlist: [/^burdy/] })],
  stats: {
    logging: 'error',
    all: false,
  },
  devServer: {
    clientLogLevel: 'error',
    hot: true,
    noInfo: true,
    stats: 'errors',
  },
  output: {
    path: PathUtil.build(),
    filename: '[name].js',
    clean: true,
  },
  optimization: {
    runtimeChunk: false,
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              cacheDirectory: true,
              cacheCompression: true,
              presets: [
                [
                  require.resolve('@babel/preset-env'),
                  {
                    modules: 'cjs',
                    loose: true,
                  },
                ],
                require.resolve('@babel/preset-typescript'),
              ],
              plugins: [
                require.resolve('babel-plugin-transform-typescript-metadata'),
                [
                  require.resolve('@babel/plugin-proposal-decorators'),
                  {
                    legacy: true,
                  },
                ],
                [
                  require.resolve('babel-plugin-module-resolver'),
                  {
                    root: ['./src/'],
                    alias: {
                      '@admin': './src/admin',
                      '@drivers': './src/drivers',
                      '@features': './src/features',
                      '@interfaces': './src/interfaces',
                      '@listeners': './src/listeners',
                      '@models': './src/models',
                      '@scripts': './src/scripts',
                      '@server': './src/server',
                      '@shared': './src/shared',
                    },
                  },
                ],
                [
                  require.resolve('@babel/plugin-transform-runtime'),
                  {
                    helpers: true,
                    regenerator: true,
                  },
                ],
              ],
            },
          },
        ],
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.ico$/],
        loader: require.resolve('url-loader'),
        options: {
          limit: 1000,
          name: '/static/[hash].[ext]',
        },
      },
    ],
  },
  resolve: {
    symlinks: false,
    extensions: ['.js', '.jsx', '.tsx', '.ts'],
    mainFields: ['browser', 'jsnext:main', 'main'],
  },
  plugins: [
    ShowErrorsPlugin,
    new webpack.DefinePlugin({
      PROJECT_ENTRY: PathUtil.exists(PathUtil.projectRoot())
        ? JSON.stringify(PathUtil.projectRoot())
        : null
    }),
    process.env.NODE_ENV === 'production' &&
      new WebpackBar({ name: 'Server', color: '#0d63c6' }),
  ].filter(Boolean),
};

export default serverDefaultWebpack;
