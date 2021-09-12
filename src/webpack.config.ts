import webpack from 'webpack';
import serverDefaultWebpack from './webpack-configs/server';
import adminDefaultWebpack from './webpack-configs/admin';

const webpackConfigureGenerator =
  (config: webpack.Configuration) =>
  (
    ...overrides: ((config: webpack.Configuration) => webpack.Configuration)[]
  ): webpack.Configuration =>
    overrides.reduce<webpack.Configuration>(
      (memo, current) => current?.(memo) ?? memo,
      config
    );

const webpackAdminConfigure = webpackConfigureGenerator(
  adminDefaultWebpack as any
);
const webpackServerConfigure = webpackConfigureGenerator(
  serverDefaultWebpack as any
);

export { webpackAdminConfigure, webpackServerConfigure };
