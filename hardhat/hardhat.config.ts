import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox"; // Includes ethers, chai, etc.

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20", // Match this with your contract pragma versions or a compatible one
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts", // Points to where Hardhat expects contract sources
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000 // Optional: extend timeout for tests
  }
};

export default config;
