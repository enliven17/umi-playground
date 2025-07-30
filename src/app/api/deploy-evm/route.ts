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
    exec(cmd, { ...opts, encoding: 'utf-8' }, (error, stdout, stderr) => {
      const out = typeof stdout === 'string' ? stdout : stdout?.toString?.() ?? '';
      const err = typeof stderr === 'string' ? stderr : stderr?.toString?.() ?? '';
      if (error) reject({ error, stdout: out, stderr: err });
      else resolve({ stdout: out, stderr: err });
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
    
    // Parse user-supplied constructor arguments from request
    const body = await req.json();
    const constructorArgs = Array.isArray(body.constructorArgs) ? body.constructorArgs : [];
    
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

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  defaultNetwork: "devnet",
  networks: {
    devnet: {
      url: "${UMI_RPC_URL}",
      accounts: ["${formattedPrivateKey}"]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
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
  const [deployer] = await ethers.getSigners();
  const ${contractName} = await ethers.getContractFactory('${contractName}');

  // User-supplied constructor arguments (injected by backend)
  const deployArgs = JSON.parse(process.env.CONSTRUCTOR_ARGS || '[]');

  console.log('Deploying with args:', deployArgs);
  const instance = await ${contractName}.deploy(...deployArgs, {
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits('0.1', 'gwei')
  });
  await instance.waitForDeployment();

  const receipt = await ethers.provider.getTransactionReceipt(instance.deploymentTransaction()?.hash!);
  console.log('${contractName} is deployed to:', receipt?.contractAddress);
  console.log('Deployment transaction hash:', instance.deploymentTransaction()?.hash);

  // Output for backend to parse
  console.log('MAIN_ADDRESS:', receipt?.contractAddress);
  console.log('MAIN_TX:', instance.deploymentTransaction()?.hash);
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
      dependencies: {
        "@openzeppelin/contracts": "^5.4.0",
        "@openzeppelin/contracts-upgradeable": "^5.4.0"
      },
      devDependencies: {
        "hardhat": "^2.19.0",
        "@nomicfoundation/hardhat-toolbox": "^4.0.0",
        "@openzeppelin/hardhat-upgrades": "^3.9.1",
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
    const installCmd = sanitizeCommand('npm install --no-optional --no-audit --no-fund');
    await execAsync(installCmd, { 
      cwd: tempDir, 
      env: { 
        ...process.env,
        npm_config_cache: '/tmp/.npm',
        npm_config_prefix: '/tmp/.npm'
      } 
    });
    console.log('Dependencies installed');
    
    // 7. Compile with sanitized command
    console.log('Compiling Solidity contract...');
    const compileCmd = sanitizeCommand('npx hardhat compile');
    await execAsync(compileCmd, { cwd: tempDir, env: { ...process.env } });
    console.log('Solidity contract compiled');
    
    // 8. Deploy with sanitized command
    console.log('Deploying Solidity contract...');
    const deployCmd = sanitizeCommand('npx hardhat run scripts/deploy.ts');
    const { stdout } = await execAsync(deployCmd, { cwd: tempDir, env: { ...process.env, CONSTRUCTOR_ARGS: JSON.stringify(constructorArgs) } });
    console.log('Solidity contract deployed:', stdout);
    
    // Extract contract addresses and tx hashes from output
    let erc20Address = null;
    let erc20Tx = null;
    let mainAddress = null;
    let mainTx = null;
    const erc20AddrMatch = stdout.match(/ERC20_ADDRESS: (0x[a-fA-F0-9]+)/);
    const erc20TxMatch = stdout.match(/ERC20_TX: (0x[a-fA-F0-9]+)/);
    const mainAddrMatch = stdout.match(/MAIN_ADDRESS: (0x[a-fA-F0-9]+)/);
    const mainTxMatch = stdout.match(/MAIN_TX: (0x[a-fA-F0-9]+)/);
    if (erc20AddrMatch) erc20Address = erc20AddrMatch[1];
    if (erc20TxMatch) erc20Tx = erc20TxMatch[1];
    if (mainAddrMatch) mainAddress = mainAddrMatch[1];
    if (mainTxMatch) mainTx = mainTxMatch[1];
    
    // Clean up temp directory immediately
    await cleanupTempDir(tempDir);
    tempDir = null;
    
    // Return both addresses and tx hashes if available
    return createSuccessResponse({
      message: 'Solidity contract deployed successfully!',
      erc20: erc20Address ? { address: erc20Address, txHash: erc20Tx } : null,
      contract: mainAddress ? { address: mainAddress, txHash: mainTx } : null,
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
