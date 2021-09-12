/**
 * Used for correcting types in TypeScript output (dist)
 * Issue: TypeScript resolves Hook Types to string | number, instead of keeping the type.
 **/
import path from "path";
import fs from "fs-extra";

(async () => {
  const hooksFile = path.join(process.cwd(), 'dist', 'src', 'shared', 'features', 'hooks.d.ts');
  const file = await fs.readFile(hooksFile, { encoding: 'utf8' });

  const corrections = [
    [/(action.*)string \| number/gi, '$1keyof Burdy.IActions'],
    [/((addFilter|applyFilters).*)string \| number/gi, '$1keyof Burdy.IFilters'],
    [/((addSync|applySync).*)string \| number/gi, '$1keyof Burdy.ISyncFilters']
  ]

  const correctedFile = corrections.reduce((previousValue, currentValue) => {
    const [regex, replace] = currentValue;
    return previousValue.replace(regex, replace as string);
  }, file);

  await fs.writeFile(hooksFile, correctedFile);
})();
