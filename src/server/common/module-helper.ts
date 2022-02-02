export const moduleExists = (module: string): boolean => {
  return !!__webpack_modules__?.[module];
};