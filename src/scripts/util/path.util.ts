import path from 'path';
import fse from 'fs-extra';
import environment from '../../env';

const PathUtil = {
  exists: (path: string) => fse.existsSync(path),
  root: (...args: string[]) => path.join(environment.rootDir, ...args),
  admin: (...args: string[]) =>
    process.env.ADMIN_PATH
      ? path.join(process.env.ADMIN_PATH, ...args)
      : PathUtil.root('admin', ...args),
  processRoot: (...args: string[]) => path.join(process.cwd(), ...args),
  burdyRoot: (...args: string[]) => PathUtil.processRoot('burdy', ...args),
  cache: (...args: string[]) => PathUtil.burdyRoot('.cache', ...args),
  projectRoot: (...args: string[]) => PathUtil.processRoot('project', ...args),
  build: (...args: string[]) => PathUtil.burdyRoot('build', ...args),
  devBuild: (...args: string[]) => PathUtil.burdyRoot('.dev-build', ...args),
  database: (...args: string[]) => PathUtil.burdyRoot('.database', ...args),
  plugins: (...args: string[]) => PathUtil.burdyRoot('plugins', ...args),
};

export default PathUtil;
