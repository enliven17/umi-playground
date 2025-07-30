import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';

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
    const { code, privateKey, accountAddress } = await req.json();
    console.log('Move deployment request received:', { code: code.substring(0, 100) + '...', privateKey: privateKey.substring(0, 10) + '...', accountAddress });
    
    if (!code || !privateKey || !accountAddress) {
      return new Response(JSON.stringify({ message: 'Code, privateKey and accountAddress are required.' }), { status: 400 });
    }
    
    const tempDir = join('/tmp', 'umi-move-' + randomUUID());
    console.log('Creating temp directory:', tempDir);
    await mkdir(tempDir, { recursive: true });
    
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
    await execAsync('aptos move compile --package-dir contracts/counter', { cwd: tempDir, env: { ...process.env } });
    console.log('Move contract compiled');
    
    // 5. Deploy Move contract with Aptos CLI
    console.log('Deploying Move contract...');
    const { stdout } = await execAsync(`aptos move publish --assume-yes --private-key ${privateKey} --named-addresses example=${accountAddress} --url https://devnet.uminetwork.com --package-dir contracts/counter`, { cwd: tempDir, env: { ...process.env } });
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
        const { stdout: accountInfo } = await execAsync(`aptos account list --account ${accountAddress} --url https://devnet.uminetwork.com --output json`, { cwd: tempDir, env: { ...process.env } });
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
    
    return new Response(JSON.stringify({ 
      message: 'Move contract deployed successfully!',
      transactionHash: txHash,
      fullOutput: stdout 
    }), { status: 200 });
  } catch (err: any) {
    console.error('Move deployment error:', err);
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
