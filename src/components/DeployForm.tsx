import React, { useState } from 'react';

type DeployFormProps = {
  onDeploy: (privateKey: string, accountAddress?: string) => void;
  contractType: 'move' | 'evm';
};

const inputStyle = {
  flex: 1,
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid rgba(200,200,255,0.25)',
  background: 'rgba(255,255,255,0.35)',
  color: '#222',
  fontSize: 16,
  boxShadow: '0 2px 8px 0 rgba(31,38,135,0.08)',
  backdropFilter: 'blur(6px)',
  outline: 'none',
  marginBottom: 0,
};

const labelStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: '#333',
  marginBottom: 6,
  display: 'block'
};

const DeployForm: React.FC<DeployFormProps> = ({ onDeploy, contractType }) => {
  const [showHowTo, setShowHowTo] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [accountAddress, setAccountAddress] = useState('');

  const handleDeploy = () => {
    onDeploy(privateKey, accountAddress);
  };

  return (
    <>
      <div style={{ margin: '20px 0', display: 'flex', gap: 16, flexDirection: 'column' }}>
        {/* Private Key Input */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={labelStyle}>🔑 Private Key</label>
          <input
            type="password"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={e => setPrivateKey(e.target.value)}
            style={inputStyle}
            autoComplete="off"
          />
        </div>

        {/* Account Address Input (Move only) */}
        {contractType === 'move' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>📧 Account Address (Move)</label>
            <input
              type="text"
              placeholder="Enter your account address (0x...)"
              value={accountAddress}
              onChange={e => setAccountAddress(e.target.value)}
              style={inputStyle}
              autoComplete="off"
            />
          </div>
        )}

        {/* Deploy Button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <button 
            onClick={handleDeploy} 
            style={{ 
              padding: '14px 40px', 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, rgba(25,118,210,0.9), rgba(25,118,210,0.7))', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: 18, 
              fontWeight: 700, 
              boxShadow: '0 4px 16px rgba(25,118,210,0.3)', 
              transition: 'all 0.3s',
              minWidth: 200
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(25,118,210,0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(25,118,210,0.3)';
            }}
          >
            🚀 Deploy Contract
          </button>
          
          <button 
            onClick={() => setShowHowTo(true)} 
            style={{ 
              padding: '14px 24px', 
              borderRadius: 12, 
              background: 'rgba(255,255,255,0.4)', 
              color: '#333', 
              border: '1px solid rgba(255,255,255,0.3)', 
              cursor: 'pointer', 
              fontSize: 16, 
              fontWeight: 600, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ❓ How to Deploy
          </button>
        </div>
      </div>

      {/* How to Deploy Modal */}
      {showHowTo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(1px)',
          borderRadius: '24px'
        }} onClick={() => setShowHowTo(false)}>
          <div style={{
            background: 'rgba(255,255,255,0.98)',
            borderRadius: 24,
            padding: '32px 40px',
            maxWidth: 600,
            width: '90%',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.4)',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1a237e' }}>💡 How to Deploy</h2>
              <button 
                onClick={() => setShowHowTo(false)}
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#666',
                  padding: '8px 12px',
                  borderRadius: 12,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                  e.currentTarget.style.color = '#666';
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              paddingRight: 12
            }}>
              <div style={{ fontSize: 16, lineHeight: 1.6, color: '#333' }}>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: '#1976d2', marginBottom: 16, fontSize: 20, fontWeight: 600 }}>🚀 Quick Start Guide</h3>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 12 }}><strong>Select Virtual Machine:</strong> Choose between MoveVM or EVM</li>
                    <li style={{ marginBottom: 12 }}><strong>Upload Contract:</strong> Click "Upload .move/.sol File" to upload your contract</li>
                    <li style={{ marginBottom: 12 }}><strong>Enter Private Key:</strong> Add your wallet's private key</li>
                    <li style={{ marginBottom: 12 }}><strong>Account Address (Move only):</strong> Enter your account address for Move contracts</li>
                    <li style={{ marginBottom: 12 }}><strong>Deploy:</strong> Click "Deploy Contract" and wait for confirmation</li>
                  </ol>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: '#1976d2', marginBottom: 16, fontSize: 20, fontWeight: 600 }}>🔧 Requirements</h3>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>Valid private key with test tokens</li>
                    <li style={{ marginBottom: 8 }}>Move contracts (.move files) for MoveVM</li>
                    <li style={{ marginBottom: 8 }}>Solidity contracts (.sol files) for EVM</li>
                    <li style={{ marginBottom: 8 }}>Account address for Move deployments</li>
                    <li style={{ marginBottom: 8 }}>Maximum file size: 1MB</li>
                    <li style={{ marginBottom: 8 }}>Maximum code length: 50,000 characters</li>
                  </ul>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: '#1976d2', marginBottom: 16, fontSize: 20, fontWeight: 600 }}>🌐 Network</h3>
                  <div style={{ 
                    padding: '16px 20px', 
                    background: 'linear-gradient(135deg, rgba(25,118,210,0.1), rgba(25,118,210,0.05))', 
                    borderRadius: 12, 
                    border: '1px solid rgba(25,118,210,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <span style={{ fontSize: 20 }}>🔗</span>
                    <div>
                      <strong style={{ color: '#1976d2' }}>Umi Devnet</strong>
                      <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>https://devnet.uminetwork.com</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 style={{ color: '#1976d2', marginBottom: 16, fontSize: 20, fontWeight: 600 }}>⚠️ Security Note</h3>
                  <div style={{ 
                    padding: '16px 20px', 
                    background: 'linear-gradient(135deg, rgba(244,67,54,0.1), rgba(244,67,54,0.05))', 
                    borderRadius: 12, 
                    border: '1px solid rgba(244,67,54,0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}>
                    <span style={{ fontSize: 20, marginTop: 2 }}>🔒</span>
                    <div style={{ fontSize: 14, color: '#d32f2f' }}>
                      <strong>Important:</strong> Never use your main wallet's private key. Create a test wallet for development purposes only.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeployForm;
