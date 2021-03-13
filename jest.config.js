module.exports = {
  setupFiles: ["<rootDir>/tests/setEnvVars.ts"],
  roots: ["<rootDir>/app/", "<rootDir>/tests/"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.[tj]sx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
}
