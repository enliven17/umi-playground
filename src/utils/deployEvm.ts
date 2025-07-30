import solc from 'solc';
import { ethers } from 'ethers';

export async function deployEvmContract({ code, privateKey }: { code: string; privateKey: string }) {
  try {
    // 1. Solidity kodunu derle
    const input = {
      language: 'Solidity',
      sources: {
        'Contract.sol': { content: code },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
      },
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractName = Object.keys(output.contracts['Contract.sol'])[0];
    const contract = output.contracts['Contract.sol'][contractName];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;
    if (!bytecode || bytecode === '0x') {
      return { success: false, error: 'Derleme başarısız veya bytecode bulunamadı.' };
    }
    // 2. Ethers ile Umi Devnet'e bağlan
    const provider = new ethers.JsonRpcProvider('https://devnet.uminetwork.com');
    const wallet = new ethers.Wallet(privateKey, provider);
    // 3. Deploy işlemi
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contractInstance = await factory.deploy();
    const tx = contractInstance.deploymentTransaction();
    if (tx) {
      await tx.wait();
    }
    return { success: true, address: contractInstance.target };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
