import webpack from 'webpack';
import WebpackBar from 'webpackbar';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import PathUtil from '@scripts/util/path.util';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FriendlyErrorsWebpackPlugin from '@soda/friendly-errors-webpack-plugin';
import { notify } from '@scripts/util/notifier.util';
import { definePublicEnv } from '@scripts/util/env.util';

const isProduction = process.env.NODE_ENV === 'production' || false;
const isDevelopment = !isProduction;

const ShowErrorsPlugin = new FriendlyErrorsWebpackPlugin({
  onErrors: (severity, errors) => {
    if (severity !== 'error') {
      return;
    }

    const [error] = errors;
    notify({ subtitle: 'Admin Webpack - Error', message: error.name });
  },
  clearConsole: false,
  compilationSuccessInfo: { messages: [], notes: [] },
});

ShowErrorsPlugin.displaySuccess = () => {};

const adminDefaultWebpack = {
  mode: isProduction ? 'production' : 'development',
  bail: !isDevelopment,
  performance: {
    hints: false,
  },
  devtool: isProduction ? false : 'cheap-module-source-map',
  entry: PathUtil.admin('index'),
  target: 'web',
  stats: {
    logging: 'error',
    all: false,
  },
  devServer: {
    hot: true,
  },
  output: {
    path: PathUtil.build('admin'),
    publicPath: '/admin/',
    filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash:8].chunk.js'
      : '[name].chunk.js',
  },
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      }),
    ],
    runtimeChunk: true,
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
              sourceType: 'unambiguous',
              presets: [
                [
                  require.resolve('@babel/preset-env'),
                  {
                    modules: 'cjs',
                  },
                ],
                require.resolve('@babel/preset-react'),
                require.resolve('@babel/preset-typescript'),
              ],
              plugins: [
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
        test: /\.s?css$/,
        exclude: [/\.module.s?[ac]ss$/],
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.module\.s?[ac]ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              additionalData: `@import "${PathUtil.admin(
                'styles',
                'global.scss'
              )}";`,
            },
          },
        ],
      },
      {
        test: /\.(svg|eot|otf|ttf|woff|woff2)$/,
        use: 'file-loader',
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.ico$/],
        loader: require.resolve('url-loader'),
        options: {
          limit: 1000,
        },
      },
      {
        test: /\.html$/,
        use: require.resolve('html-loader'),
      },
      {
        test: /\.(mp4|webm)$/,
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000,
        },
      },
    ],
  },
  resolve: {
    symlinks: false,
    extensions: ['.js', '.jsx', '.tsx', '.ts'],
    mainFields: ['browser', 'jsnext:main', 'main'],
    fallback: {},
  },
  plugins: [
    ShowErrorsPlugin,
    new HtmlWebpackPlugin({
      inject: true,
      template: PathUtil.admin('index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
      chunkFilename: '[name].[chunkhash].chunkhash.css',
      ignoreOrder: true,
    }),
    process.env.NODE_ENV === 'production' &&
      new WebpackBar({ name: 'Admin', color: '#8f47d4' }),
  ].filter(Boolean),
};

adminDefaultWebpack.plugins.push(
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    PUBLIC_PATH: webpack.DefinePlugin.runtimeValue(() =>
      JSON.stringify(adminDefaultWebpack.output.publicPath)
    ),
    ROUTER_PATH: webpack.DefinePlugin.runtimeValue(() =>
      JSON.stringify(adminDefaultWebpack.output.publicPath.replace(/\/?$/, ''))
    ),
    PROJECT_ADMIN_ENTRY: PathUtil.exists(PathUtil.projectRoot('admin'))
      ? JSON.stringify(PathUtil.projectRoot('admin'))
      : null,
    ...definePublicEnv(),
  })
);

export default adminDefaultWebpack;
