import { Account, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export async function deployMoveBytecode({ bytecodeHex, privateKey }: { bytecodeHex: string; privateKey: string }) {
  try {
    const config = new AptosConfig({ network: Network.DEVNET, fullnode: 'https://devnet.uminetwork.com' });
    const aptos = new Aptos(config);
    const account = Account.fromPrivateKey({ privateKey });
    // Publish package (bytecodeHex should be 0x... hex string)
    const tx = await aptos.publishPackage({
      account,
      modules: [bytecodeHex],
    });
    await aptos.waitForTransaction({ transactionHash: tx.hash });
    return { success: true, hash: tx.hash };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
