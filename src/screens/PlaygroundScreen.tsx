"use client";
import React, { useState } from 'react';
import CodeEditor from '@/components/CodeEditor';
import DeployForm from '@/components/DeployForm';
import ResultBox from '@/components/ResultBox';

const HowToUse = () => (
  <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 18, marginTop: 18, color: '#1a237e', fontSize: 16, maxWidth: 900, width: '100%', margin: '18px auto 0 auto', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
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
  const [contractType, setContractType] = useState<'move' | 'evm'>('evm');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const handleDeploy = async (privateKey: string, accountAddress?: string) => {
    if (!code.trim()) {
      alert('Please enter contract code');
      return;
    }
    if (!privateKey.trim()) {
      alert('Please enter your private key');
      return;
    }
    if (contractType === 'move' && !accountAddress?.trim()) {
      alert('Please enter your account address for Move contracts');
      return;
    }

    setResult({ message: 'Deploying...' });

    try {
      const endpoint = contractType === 'move' ? '/api/deploy-move' : '/api/deploy-evm';
      const payload = contractType === 'move'
        ? { code, privateKey, accountAddress }
        : { code, privateKey };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      // Handle new API response format
      if (response.ok) {
        setResult({
          message: data.message || 'Deployment successful!',
          contractAddress: data.contractAddress,
          transactionHash: data.transactionHash,
          rateLimitRemaining: data.rateLimitRemaining,
          rateLimitResetIn: data.rateLimitResetIn
        });
      } else {
        setResult({
          message: data.error || 'Deployment failed',
          error: true
        });
      }
    } catch (error) {
      setResult({ 
        message: `Deploy failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: true
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #e0e7ef 0%, #c9e7fa 100%)', position: 'relative', overflowX: 'hidden', padding: '0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '90vw', maxWidth: 1400, margin: '40px auto 24px auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, borderRadius: 24, background: 'rgba(255,255,255,0.25)', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)', padding: '18px 48px' }}>
        <img src="/logo2.png" alt="Umi Logo" style={{ width: 54, height: 54, objectFit: 'contain', borderRadius: 12, background: 'rgba(255,255,255,0.18)' }} />
        <span style={{ fontSize: 44, fontWeight: 800, color: '#222', letterSpacing: 0.5, textShadow: '0 2px 8px #0001' }}>Umi Playground</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center', alignItems: 'center', width: '90vw', maxWidth: 1400, borderRadius: 16, background: 'rgba(255,255,255,0.18)', boxShadow: '0 4px 16px 0 rgba(31,38,135,0.10)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', padding: '18px 36px' }}>
        <span style={{ fontWeight: 500, fontSize: 18, color: '#333', marginRight: 12 }}>Virtual Machine:</span>
        <button 
          disabled
          style={{ 
            minWidth: 110, 
            fontSize: 18, 
            fontWeight: 600, 
            background: 'rgba(128,128,128,0.3)', 
            color: 'rgba(255,255,255,0.6)', 
            border: 'none', 
            borderRadius: 10, 
            padding: '12px 32px', 
            cursor: 'not-allowed', 
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          MoveVM
          <span style={{ 
            position: 'absolute', 
            top: -8, 
            right: -8, 
            background: '#ff6b6b', 
            color: 'white', 
            fontSize: 10, 
            padding: '2px 6px', 
            borderRadius: 8, 
            fontWeight: 600 
          }}>
            Soon
          </span>
        </button>
        <button onClick={() => setContractType('evm')} style={{ minWidth: 110, fontSize: 18, fontWeight: 600, background: contractType === 'evm' ? 'rgba(25,118,210,0.85)' : 'rgba(255,255,255,0.5)', color: contractType === 'evm' ? '#fff' : '#1a237e', border: 'none', borderRadius: 10, padding: '12px 32px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: contractType === 'evm' ? '0 2px 8px #1976d233' : 'none' }}>EVM</button>
      </div>
      <div style={{ width: '90vw', maxWidth: 1400, margin: '0 auto', background: 'rgba(255,255,255,0.18)', borderRadius: 22, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)', padding: '40px 36px 32px 36px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 18, color: '#333', textShadow: '0 1px 4px #fff8' }}>Solidity Contract</div>
        <div style={{ width: '100%', marginBottom: 24 }}>
          <CodeEditor code={code} onChange={setCode} language={contractType === 'move' ? 'move' : 'solidity'} />
        </div>
        <div style={{ width: '100%', marginBottom: 0 }}>
          <DeployForm
            onDeploy={handleDeploy}
            contractType={contractType}
          />
        </div>
      </div>
      {/* Result Box */}
      {result && (
        <div style={{ width: '90vw', maxWidth: 1400, margin: '0 auto', background: 'rgba(255,255,255,0.18)', borderRadius: 18, boxShadow: '0 4px 16px 0 rgba(31,38,135,0.10)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', padding: '16px 24px' }}>
          <ResultBox result={result} />
        </div>
      )}
      
      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '40px 20px 20px',
        textAlign: 'center',
        background: 'transparent',
        color: '#333',
        fontSize: 14
      }}>
        <div style={{ marginBottom: 8 }}>
          Built on <strong style={{ color: '#1976d2' }}>Umi</strong>. 🌊
        </div>
        <div>
          by{' '}
          <a 
            href="https://github.com/enliven17" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#1976d2',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
              borderBottom: '1px solid transparent'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#1565c0';
              e.currentTarget.style.borderBottomColor = '#1565c0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#1976d2';
              e.currentTarget.style.borderBottomColor = 'transparent';
            }}
          >
            enliven
          </a>
        </div>
      </footer>
    </div>
  );
};
export default PlaygroundScreen;
