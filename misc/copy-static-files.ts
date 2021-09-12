/**
 * This helper copies all static files (such as .d.ts, .html, and .svg) after compilation to dist
**/
// @ts-ignore
import copyFiles from 'copyfiles';

(async() => {
  await new Promise<void>(resolve => {
    copyFiles([
      'src/**/*.d.ts',
      'src/**/*.html',
      'src/**/**/*.scss',
      'src/**/**/*.svg',
      'dist/src',
    ], 1, () => resolve());
  })
})();
