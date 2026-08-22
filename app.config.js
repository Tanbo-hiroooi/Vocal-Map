module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.VOCAL_MAP_GITHUB_PAGES === 'true'
      ? { baseUrl: '/Vocal-Map' }
      : {}),
  },
});
