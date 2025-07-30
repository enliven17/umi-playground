"use client";
import React, { useState } from 'react';
import CodeEditor from '@/components/CodeEditor';
import DeployForm from '@/components/DeployForm';
import ResultBox from '@/components/ResultBox';

const HowToUse = () => (
  <div style={{ background: '#e3f2fd', borderRadius: 8, padding: 18, marginTop: 18, color: '#1a237e', fontSize: 16, maxWidth: 900, width: '100%', margin: '18px auto 0 auto' }}>
    <b>💡 How to use:</b>
    <ol style={{ margin: '10px 0 0 18px', padding: 0 }}>
      <li>Select MoveVM or EVM</li>
      <li>Write your contract code</li>
      <li>Enter your private key</li>
      <li>Click the Deploy button</li>
    </ol>
  </div>
);

const PlaygroundScreen: React.FC = () => {
  const [contractType, setContractType] = useState<'move' | 'evm'>('move');
  const [code, setCode] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [accountAddress, setAccountAddress] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const handleDeploy = async () => {
    setResult('Deploying...');
    try {
      const body: any = { code, privateKey };
      if (contractType === 'move') body.accountAddress = accountAddress;
      const res = await fetch(`/api/deploy-${contractType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data.message || JSON.stringify(data));
    } catch (err) {
      setResult('Deploy failed: ' + (err as Error).message);
    }
  };
  return (
    <div style={{ minHeight: '100vh', background: '#fafcff', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 18 }}>
        <img src="/app/logo2.png" alt="Umi Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
        <span style={{ fontSize: 38, fontWeight: 700, color: '#222', letterSpacing: 0.5 }}>Umi Playground</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: 900 }}>
        <span style={{ fontWeight: 500, fontSize: 16, color: '#333', marginRight: 8 }}>Virtual Machine:</span>
        <button onClick={() => setContractType('move')} style={{ minWidth: 90, fontSize: 16, fontWeight: 600, background: contractType === 'move' ? '#1976d2' : '#e3eafc', color: contractType === 'move' ? '#fff' : '#1a237e', border: 'none', borderRadius: 6, padding: '7px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>MoveVM</button>
        <button onClick={() => setContractType('evm')} style={{ minWidth: 90, fontSize: 16, fontWeight: 600, background: contractType === 'evm' ? '#1976d2' : '#e3eafc', color: contractType === 'evm' ? '#fff' : '#1a237e', border: 'none', borderRadius: 6, padding: '7px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>EVM</button>
      </div>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: '28px 24px 18px 24px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 10, color: '#333' }}>{contractType === 'move' ? 'Move Contract' : 'Solidity Contract'}</div>
        <div style={{ width: '100%', marginBottom: 18 }}>
          <CodeEditor code={code} onChange={setCode} language={contractType === 'move' ? 'move' : 'solidity'} />
        </div>
        <div style={{ width: '100%', marginBottom: 0 }}>
          <DeployForm
            privateKey={privateKey}
            onChange={setPrivateKey}
            onDeploy={handleDeploy}
            accountAddress={contractType === 'move' ? accountAddress : undefined}
            onAccountAddressChange={setAccountAddress}
          />
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
        <ResultBox result={result} />
      </div>
      <HowToUse />
    </div>
  );
};
export default PlaygroundScreen;
