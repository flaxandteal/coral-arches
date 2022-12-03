module.exports = {
  projectId: 'arches',
  video: true,
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: 'http://localhost:8000/',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
}
