const hre = require("hardhat");

async function main() {
  const escrowAddress = process.env.ESCROW_ADDRESS;
  const agentAddress = process.env.AGENT_ADDRESS;

  if (!escrowAddress || !agentAddress) {
    throw new Error("Set ESCROW_ADDRESS and AGENT_ADDRESS in your .env first");
  }

  const escrow = await hre.ethers.getContractAt("ClearChainEscrow", escrowAddress);
  const tx = await escrow.setVerifier(agentAddress, true);
  await tx.wait();

  console.log(`Authorized ${agentAddress} as a verifier on ${escrowAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
