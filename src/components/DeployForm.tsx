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
  padding: 8,
  borderRadius: 4,
  border: '1px solid #ccc',
  background: '#fff',
  color: '#222',
  fontSize: 16,
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
      <button onClick={onDeploy} style={{ padding: '8px 20px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16 }}>
        Deploy
      </button>
    </div>
  </div>
);

export default DeployForm;
