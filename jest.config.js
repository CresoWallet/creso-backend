module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/", "<rootDir>/__tests__/"],
  modulePaths: ["<rootDir>/src/", "<rootDir>/__tests__/"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.js"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/"],
};
