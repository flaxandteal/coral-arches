module.exports = {
  projectId: 'arches',
  video: true,
  e2e: {
    setupNodeEvents(on, config) {},
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    experimentalStudio: true,
  },
}
