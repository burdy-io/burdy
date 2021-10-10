import PathUtil from "@scripts/util/path.util";
import rimraf from "rimraf";
import {webpackServerConfigure} from "../webpack.config";
import config from "@shared/features/config";
import webpack from "webpack";
import {compilerRun} from "@scripts/util/webpack.util";
import glob from 'fast-glob';
import path from 'path';

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
  const requireComponentFiles = componentFiles.map(
    file => `./${path.relative(PathUtil.processRoot(), PathUtil.processRoot(file))}`
  );

  const requireStatements = componentFiles.map(file => (
    `
    { 
      require: () => __webpack_require__('./${path.relative(PathUtil.processRoot(), PathUtil.processRoot(file))}'), 
      file: '${file}' 
    }
    `
  )).join(',\n');

  const webpackServerConfig = webpackServerConfigure((webpackConfig) => {
    webpackConfig.entry = [
      PathUtil.root('scripts', 'entry', 'content-types'),
      ...requireComponentFiles
    ];
    webpackConfig.devtool = false;
    webpackConfig.output.path = ctBuildDirectory;
    webpackConfig.module.rules = [{
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
              require.resolve('@babel/preset-react'),
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
    }]
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
};

export default scriptContentTypes;
