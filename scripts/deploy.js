const hre = require("hardhat");

async function main() {
  const ClearChainEscrow = await hre.ethers.getContractFactory("ClearChainEscrow");
  const escrow = await ClearChainEscrow.deploy();
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("ClearChainEscrow deployed to:", address);
  console.log("Set this as ESCROW_ADDRESS in your .env for the agent.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
