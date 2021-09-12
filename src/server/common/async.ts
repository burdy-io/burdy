const runAsync = (...functions: (() => Promise<void>)[]) => {
  functions.forEach((fn) => fn?.());
};

export { runAsync };
