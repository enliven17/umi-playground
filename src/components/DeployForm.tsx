import React from 'react';

type DeployFormProps = {
  privateKey: string;
  onChange: (value: string) => void;
  onDeploy: () => void;
  accountAddress?: string;
  onAccountAddressChange?: (value: string) => void;
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

const DeployForm: React.FC<DeployFormProps> = ({ privateKey, onChange, onDeploy, accountAddress, onAccountAddressChange }) => (
  <div style={{ margin: '20px 0', display: 'flex', gap: 16, flexDirection: 'column' }}>
    {/* Private Key Input */}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={labelStyle}>🔑 Private Key</label>
      <input
        type="password"
        placeholder="Enter your private key (0x...)"
        value={privateKey}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        autoComplete="off"
      />
    </div>

    {/* Account Address Input (Move only) */}
    {typeof accountAddress === 'string' && onAccountAddressChange && (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={labelStyle}>📧 Account Address (Move)</label>
        <input
          type="text"
          placeholder="Enter your account address (0x...)"
          value={accountAddress}
          onChange={e => onAccountAddressChange(e.target.value)}
          style={inputStyle}
          autoComplete="off"
        />
      </div>
    )}

    {/* Deploy Button */}
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
      <button 
        onClick={onDeploy} 
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
    </div>
  </div>
);

export default DeployForm;
