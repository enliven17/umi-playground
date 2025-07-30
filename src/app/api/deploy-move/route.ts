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
    
    const { code, privateKey, accountAddress } = body;
    
    // Ensure private key has 0x prefix
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    // Log request (without sensitive data)
    console.log('Move deployment request received:', { 
      codeLength: code.length, 
      privateKeyPrefix: formattedPrivateKey.substring(0, 10) + '...',
      accountAddressPrefix: accountAddress.substring(0, 10) + '...',
      clientIP,
      rateLimitRemaining: rateLimit.remaining
    });
    
    // Create temporary directory
    tempDir = join('/tmp', 'umi-move-' + randomUUID().toString());
    console.log('Creating temp directory:', tempDir);
    await mkdir(tempDir, { recursive: true });
    
    // Schedule cleanup
    scheduleCleanup(tempDir);
    
    // 1. Create contracts/counter directory structure
    await mkdir(join(tempDir, 'contracts/counter/sources'), { recursive: true });
    
    // 2. Write contract code
    const contractPath = join(tempDir, 'contracts/counter/sources/counter.move');
    await writeFile(contractPath, code, 'utf8');
    console.log('Contract written to:', contractPath);
    
    // 3. Write Move.toml
    const moveToml = `
[package]
name = "counter"
version = "1.0.0"
authors = []

[addresses]
example = "${accountAddress}"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "aptos-release-v1.27"
subdir = "aptos-framework"
`;
    await writeFile(join(tempDir, 'contracts/counter/Move.toml'), moveToml, 'utf8');
    console.log('Move.toml written');
    
    // 4. Compile Move contract with Aptos CLI
    console.log('Compiling Move contract...');
    const compileCmd = sanitizeCommand('aptos move compile --package-dir contracts/counter');
    await execAsync(compileCmd, { cwd: tempDir, env: { ...process.env } });
    console.log('Move contract compiled');
    
    // 5. Deploy Move contract with Aptos CLI
    console.log('Deploying Move contract...');
    const deployCmd = sanitizeCommand(`aptos move publish --assume-yes --private-key ${formattedPrivateKey} --named-addresses example=${accountAddress} --url https://devnet.uminetwork.com --package-dir contracts/counter`);
    const { stdout } = await execAsync(deployCmd, { cwd: tempDir, env: { ...process.env } });
    console.log('Move contract deployed:', stdout);
    
    // Extract transaction hash from output
    let txHash = 'Transaction hash not found';
    
    // Try regex patterns to find transaction hash
    const patterns = [
      /Transaction Hash: ([a-fA-F0-9]+)/,
      /"hash":\s*"([a-fA-F0-9]+)"/,
      /hash:\s*([a-fA-F0-9]+)/,
      /txn_hash:\s*([a-fA-F0-9]+)/,
      /([a-fA-F0-9]{64})/  // 64 character hex string
    ];
    
    for (const pattern of patterns) {
      const match = stdout.match(pattern);
      if (match) {
        txHash = match[1];
        break;
      }
    }
    
    // If no hash found, try to get it from the last successful deployment
    if (txHash === 'Transaction hash not found') {
      try {
        const accountInfoCmd = sanitizeCommand(`aptos account list --account ${accountAddress} --url https://devnet.uminetwork.com --output json`);
        const { stdout: accountInfo } = await execAsync(accountInfoCmd, { cwd: tempDir, env: { ...process.env } });
        const accountData = JSON.parse(accountInfo);
        if (accountData.result && accountData.result.sequence_number) {
          txHash = `Last sequence: ${accountData.result.sequence_number}`;
        }
      } catch (e) {
        console.log('Could not get account info for hash extraction');
        // If still no hash, use a placeholder since deployment was successful
        txHash = 'Deployment successful - hash not available';
      }
    }
    
    // Clean up temp directory immediately
    await cleanupTempDir(tempDir);
    tempDir = null;
    
    return createSuccessResponse({ 
      message: 'Move contract deployed successfully!',
      transactionHash: txHash,
      rateLimitRemaining: rateLimit.remaining,
      rateLimitResetIn: rateLimit.resetInSeconds
    });
    
  } catch (err: any) {
    console.error('Move deployment error:', err);
    
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
