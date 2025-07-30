import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';

const APTOS_FRAMEWORK_REV = 'aptos-release-v1.27';

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
    if (!code || !privateKey || !accountAddress) {
      return new Response(JSON.stringify({ message: 'Code, privateKey and accountAddress are required.' }), { status: 400 });
    }
    const tempDir = join('/tmp', 'umi-move-' + randomUUID());
    await mkdir(join(tempDir, 'sources'), { recursive: true });
    // 1. counter.move
    const contractPath = join(tempDir, 'sources/counter.move');
    await writeFile(contractPath, code, 'utf8');
    // 2. Move.toml
    const moveToml = `
[package]
name = "counter"
version = "1.0.0"
authors = []

[addresses]
example = "${accountAddress}"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "${APTOS_FRAMEWORK_REV}"
subdir = "aptos-framework"
`;
    await writeFile(join(tempDir, 'Move.toml'), moveToml, 'utf8');
    // 3. Compile
    await execAsync('aptos move compile', { cwd: tempDir, env: { ...process.env } });
    // 4. Publish (deploy)
    const publishCmd = `aptos move publish --assume-yes --private-key ${privateKey} --named-addresses example=${accountAddress} --profile default`;
    const { stdout } = await execAsync(publishCmd, { cwd: tempDir, env: { ...process.env } });
    // 5. Sonucu döndür
    return new Response(JSON.stringify({ message: stdout }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Error: ' + (err.error?.message || err.message), stdout: err.stdout, stderr: err.stderr }), { status: 500 });
  }
}
