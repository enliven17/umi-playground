import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';

const UMI_RPC_URL = 'https://devnet.uminetwork.com';

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
    console.log('EVM deployment request received:', { code: code.substring(0, 100) + '...', privateKey: privateKey.substring(0, 10) + '...' });
    
    if (!code || !privateKey) {
      return new Response(JSON.stringify({ message: 'Contract and privateKey are required.' }), { status: 400 });
    }
    
    const tempDir = join('/tmp', 'umi-evm-' + randomUUID().toString());
    console.log('Creating temp directory:', tempDir);
    await mkdir(tempDir, { recursive: true });
    
    // 1. Create contracts directory and HelloWorld.sol
    await mkdir(join(tempDir, 'contracts'), { recursive: true });
    const contractPath = join(tempDir, 'contracts/HelloWorld.sol');
    await writeFile(contractPath, code, 'utf8');
    console.log('Contract written to:', contractPath);
    
    // 2. hardhat.config.ts (Umi dokümantasyonuna göre)
    const hardhatConfig = `
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@moved/hardhat-plugin';

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "devnet",
  networks: {
    devnet: {
      url: "${UMI_RPC_URL}",
      accounts: ["${privateKey}"]
    }
  }
};

export default config;
`;
    await writeFile(join(tempDir, 'hardhat.config.ts'), hardhatConfig, 'utf8');
    console.log('Hardhat config written');
    
    // 3. scripts/deploy.ts (Umi dokümantasyonuna göre)
    const deployScript = `
import { ethers } from 'hardhat';

async function main() {
  const HelloWorld = await ethers.getContractFactory('HelloWorld');
  const helloWorld = await HelloWorld.deploy({
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits('0.1', 'gwei')
  });
  await helloWorld.waitForDeployment();
  
  // Get the generated contract address from the transaction receipt, don't use \`await helloWorld.getAddress()\`
  const receipt = await ethers.provider.getTransactionReceipt(helloWorld.deploymentTransaction()?.hash!);
  console.log('HelloWorld is deployed to:', receipt?.contractAddress);
  console.log('Deployment transaction hash:', helloWorld.deploymentTransaction()?.hash);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
`;
    await mkdir(join(tempDir, 'scripts'), { recursive: true });
    await writeFile(join(tempDir, 'scripts/deploy.ts'), deployScript, 'utf8');
    console.log('Deploy script written');
    
    // 4. package.json (Umi dokümantasyonuna göre)
    const pkg = {
      name: "umi-evm-temp",
      version: "1.0.0",
      private: true,
      scripts: { "deploy": "npx hardhat run scripts/deploy.ts" },
      devDependencies: {
        "hardhat": "^2.19.0",
        "@nomicfoundation/hardhat-toolbox": "^4.0.0",
        "@moved/hardhat-plugin": "^0.2.1",
        "typescript": "^5.0.0",
        "@types/node": "^20.0.0"
      }
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(pkg), 'utf8');
    console.log('Package.json written');
    
    // 5. tsconfig.json
    const tsconfig = `
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
`;
    await writeFile(join(tempDir, 'tsconfig.json'), tsconfig, 'utf8');
    console.log('Tsconfig.json written');
    
    // 6. Install dependencies
    console.log('Installing dependencies...');
    await execAsync('npm install', { cwd: tempDir, env: { ...process.env } });
    console.log('Dependencies installed');
    
    // 7. Compile
    console.log('Compiling Solidity contract...');
    await execAsync('npx hardhat compile', { cwd: tempDir, env: { ...process.env } });
    console.log('Solidity contract compiled');
    
    // 8. Deploy
    console.log('Deploying Solidity contract...');
    const { stdout } = await execAsync('npx hardhat run scripts/deploy.ts', { cwd: tempDir, env: { ...process.env } });
    console.log('Solidity contract deployed:', stdout);
    
    // Extract contract address from output
    const contractAddressMatch = stdout.match(/HelloWorld is deployed to: (0x[a-fA-F0-9]+)/);
    const contractAddress = contractAddressMatch ? contractAddressMatch[1] : 'Contract address not found';

               // Extract transaction hash from output
           let txHash = 'Transaction hash not found';
           const txHashMatch = stdout.match(/Deployment transaction hash: (0x[a-fA-F0-9]+)/);
           if (txHashMatch) {
             txHash = txHashMatch[1];
           }

    return new Response(JSON.stringify({
      message: 'Solidity contract deployed successfully!',
      contractAddress: contractAddress,
      transactionHash: txHash,
      fullOutput: stdout
    }), { status: 200 });
  } catch (err: any) {
    console.error('EVM deployment error:', err);
    const errorMessage = err.error?.message || err.message || 'Unknown error';
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';
    
    return new Response(JSON.stringify({ 
      message: 'Error: ' + errorMessage, 
      stdout: stdout, 
      stderr: stderr,
      fullError: err 
    }), { status: 500 });
  }
}
