module.exports = {
  projectId: 'arches',
  video: true,
  e2e: {
    baseUrl: "http://localhost:8000",
    setupNodeEvents(on, config) {},
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  }
}
