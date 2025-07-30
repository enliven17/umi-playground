import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';

const UMI_RPC_URL = 'https://devnet.uminetwork.com';
const UMI_CHAIN_ID = 42069;

function execAsync(cmd: string, opts: any = {}): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, opts, (error, stdout, stderr) => {
      if (error) reject({ error, stdout, stderr });
      else resolve({ stdout, stderr });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { code, privateKey } = await req.json();
    if (!code || !privateKey) {
      return new Response(JSON.stringify({ message: 'Code and privateKey are required.' }), { status: 400 });
    }
    const tempDir = join('/tmp', 'umi-evm-' + randomUUID());
    await mkdir(tempDir, { recursive: true });
    // 1. Contract.sol
    const contractPath = join(tempDir, 'Contract.sol');
    await writeFile(contractPath, code, 'utf8');
    // 2. hardhat.config.js
    const hardhatConfig = `
require("@nomicfoundation/hardhat-toolbox");
require("@moved/hardhat-plugin");
module.exports = {
  defaultNetwork: "devnet",
  networks: {
    devnet: {
      url: "${UMI_RPC_URL}",
      chainId: ${UMI_CHAIN_ID},
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: "0.8.20"
};
`;
    await writeFile(join(tempDir, 'hardhat.config.js'), hardhatConfig, 'utf8');
    // 3. scripts/deploy.js
    const deployScript = `
const hre = require("hardhat");
async function main() {
  const Contract = await hre.ethers.getContractFactory("Contract");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed to:", contract.target);
}
main().catch((error) => { console.error(error); process.exit(1); });
`;
    await mkdir(join(tempDir, 'scripts'), { recursive: true });
    await writeFile(join(tempDir, 'scripts/deploy.js'), deployScript, 'utf8');
    // 4. package.json (minimum)
    const pkg = {
      name: "umi-evm-temp",
      version: "1.0.0",
      private: true,
      scripts: { "deploy": "npx hardhat run scripts/deploy.js --network devnet" },
      dependencies: {},
      devDependencies: {}
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(pkg), 'utf8');
    // 5. Compile
    await execAsync('npx hardhat compile', { cwd: tempDir, env: { ...process.env, PRIVATE_KEY: privateKey } });
    // 6. Deploy
    const { stdout } = await execAsync('npx hardhat run scripts/deploy.js --network devnet', { cwd: tempDir, env: { ...process.env, PRIVATE_KEY: privateKey } });
    // 7. Sonucu döndür
    return new Response(JSON.stringify({ message: stdout }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Error: ' + (err.error?.message || err.message), stdout: err.stdout, stderr: err.stderr }), { status: 500 });
  }
}
