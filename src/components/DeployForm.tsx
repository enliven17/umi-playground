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

const DeployForm: React.FC<DeployFormProps> = ({ privateKey, onChange, onDeploy, accountAddress, onAccountAddressChange }) => (
  <div style={{ margin: '16px 0', display: 'flex', gap: 8, flexDirection: 'column' }}>
    {typeof accountAddress === 'string' && onAccountAddressChange && (
      <input
        type="text"
        placeholder="Account Address (Move)"
        value={accountAddress}
        onChange={e => onAccountAddressChange(e.target.value)}
        style={inputStyle}
        autoComplete="off"
      />
    )}
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="password"
        placeholder="Private Key"
        value={privateKey}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        autoComplete="off"
      />
      <button onClick={onDeploy} style={{ padding: '12px 28px', borderRadius: 8, background: 'rgba(25,118,210,0.85)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600, boxShadow: '0 2px 8px #1976d233', transition: 'all 0.2s' }}>
        Deploy
      </button>
    </div>
  </div>
);

export default DeployForm;
