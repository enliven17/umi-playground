import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { 
  validateInput, 
  checkRateLimit, 
  sanitizeCommand, 
  cleanupTempDir, 
  scheduleCleanup, 
  getClientIP, 
  createErrorResponse, 
  createSuccessResponse,
  securityHeaders 
} from '@/lib/security';

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
  let tempDir: string | null = null;
  
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
      return createErrorResponse(
        `Rate limit exceeded. Try again in ${rateLimit.resetInSeconds} seconds.`,
        429
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Input validation
    const validation = validateInput(body);
    if (!validation.isValid) {
      return createErrorResponse(validation.error!);
    }
    
    const { code, privateKey } = body;
    
    // Ensure private key has 0x prefix
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    // Log request (without sensitive data)
    console.log('EVM deployment request received:', { 
      codeLength: code.length, 
      privateKeyPrefix: formattedPrivateKey.substring(0, 10) + '...',
      clientIP,
      rateLimitRemaining: rateLimit.remaining
    });
    
    // Extract and validate contract name
    const contractNameMatch = code.match(/contract\s+(\w+)/);
    if (!contractNameMatch) {
      return createErrorResponse('No valid contract found in code');
    }
    
    const contractName = contractNameMatch[1];
    console.log('Detected contract name:', contractName);
    
    // Create temporary directory
    tempDir = join('/tmp', 'umi-evm-' + randomUUID().toString());
    console.log('Creating temp directory:', tempDir);
    await mkdir(tempDir, { recursive: true });
    
    // Schedule cleanup
    scheduleCleanup(tempDir);
    
    // 1. Create contracts directory and contract file
    await mkdir(join(tempDir, 'contracts'), { recursive: true });
    const contractPath = join(tempDir, `contracts/${contractName}.sol`);
    await writeFile(contractPath, code, 'utf8');
    console.log('Contract written to:', contractPath);
    
    // 2. hardhat.config.ts
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
      accounts: ["${formattedPrivateKey}"]
    }
  }
};

export default config;
`;
    await writeFile(join(tempDir, 'hardhat.config.ts'), hardhatConfig, 'utf8');
    console.log('Hardhat config written');
    
    // 3. scripts/deploy.ts
    const deployScript = `
import { ethers } from 'hardhat';

async function main() {
  const ${contractName} = await ethers.getContractFactory('${contractName}');
  const ${contractName.toLowerCase()} = await ${contractName}.deploy({
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits('0.1', 'gwei')
  });
  await ${contractName.toLowerCase()}.waitForDeployment();
  
  const receipt = await ethers.provider.getTransactionReceipt(${contractName.toLowerCase()}.deploymentTransaction()?.hash!);
  console.log('${contractName} is deployed to:', receipt?.contractAddress);
  console.log('Deployment transaction hash:', ${contractName.toLowerCase()}.deploymentTransaction()?.hash);
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
    
    // 4. package.json
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
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');
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
    
    // 6. Install dependencies with sanitized command
    console.log('Installing dependencies...');
    const installCmd = sanitizeCommand('npm install');
    await execAsync(installCmd, { cwd: tempDir, env: { ...process.env } });
    console.log('Dependencies installed');
    
    // 7. Compile with sanitized command
    console.log('Compiling Solidity contract...');
    const compileCmd = sanitizeCommand('npx hardhat compile');
    await execAsync(compileCmd, { cwd: tempDir, env: { ...process.env } });
    console.log('Solidity contract compiled');
    
    // 8. Deploy with sanitized command
    console.log('Deploying Solidity contract...');
    const deployCmd = sanitizeCommand('npx hardhat run scripts/deploy.ts');
    const { stdout } = await execAsync(deployCmd, { cwd: tempDir, env: { ...process.env } });
    console.log('Solidity contract deployed:', stdout);
    
    // Extract contract address from output
    const contractAddressRegex = new RegExp(`${contractName} is deployed to: (0x[a-fA-F0-9]+)`);
    const contractAddressMatch = stdout.match(contractAddressRegex);
    const contractAddress = contractAddressMatch ? contractAddressMatch[1] : 'Contract address not found';
    
    // Extract transaction hash from output
    let txHash = 'Transaction hash not found';
    const txHashMatch = stdout.match(/Deployment transaction hash: (0x[a-fA-F0-9]+)/);
    if (txHashMatch) {
      txHash = txHashMatch[1];
    }
    
    // Clean up temp directory immediately
    await cleanupTempDir(tempDir);
    tempDir = null;
    
    return createSuccessResponse({
      message: 'Solidity contract deployed successfully!',
      contractAddress: contractAddress,
      transactionHash: txHash,
      rateLimitRemaining: rateLimit.remaining,
      rateLimitResetIn: rateLimit.resetInSeconds
    });
    
  } catch (err: any) {
    console.error('EVM deployment error:', err);
    
    // Clean up temp directory on error
    if (tempDir) {
      await cleanupTempDir(tempDir).catch(console.error);
    }
    
    const errorMessage = err.error?.message || err.message || 'Unknown error';
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';
    
    return createErrorResponse(
      `Deployment failed: ${errorMessage}`,
      500
    );
  }
}
