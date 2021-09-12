const defaultBurdyConfig: any = {
  webpack: {
    admin: (config) => config,
    server: (config) => config,
  },
};

const loadConfig = () => {
  return defaultBurdyConfig;
};

const config = loadConfig();

export default config;
