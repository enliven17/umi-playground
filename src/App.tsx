import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import CodeEditor from './components/CodeEditor';
import { deployMoveBytecode } from './utils/deployMove';
import { deployEvmContract } from './utils/deployEvm';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
`;
const Toggle = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;
const ToggleButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1.5rem;
  margin: 0 0.5rem;
  border: none;
  border-radius: 4px;
  background: ${({ active }) => (active ? '#007aff' : '#e0e0e0')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  font-weight: bold;
  cursor: pointer;
`;
const EditorPlaceholder = styled.textarea`
  width: 500px;
  height: 250px;
  font-family: 'Fira Mono', monospace;
  font-size: 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  padding: 1rem;
  resize: vertical;
`;
const Input = styled.input`
  width: 500px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;
const DeployButton = styled.button`
  width: 500px;
  padding: 0.75rem;
  border-radius: 6px;
  border: none;
  background: #007aff;
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 1rem;
`;
const Result = styled.div<{ success?: boolean; error?: boolean }>`
  width: 500px;
  min-height: 40px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #eee;
  padding: 1rem;
  color: ${({ success, error }) => error ? '#b00' : success ? '#0a0' : '#333'};
  font-weight: ${({ success, error }) => (success || error) ? 'bold' : 'normal'};
  margin-top: 0.5rem;
`;

const defaultMove = `module example::Counter {
    use std::signer;
    struct Counter has key, store {
        value: u64,
    }
    public entry fun initialize(account: &signer) {
        move_to(account, Counter { value: 0 });
    }
    public entry fun increment(account: &signer) acquires Counter {
        let counter = borrow_global_mut<Counter>(signer::address_of(account));
        counter.value = counter.value + 1;
    }
    public fun get(account: address): u64 acquires Counter {
        let counter = borrow_global<Counter>(account);
        counter.value
    }
}`;
const defaultSolidity = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract Counter {
    uint public value;
    function increment() public {
        value += 1;
    }
}`;

const App = () => {
  const [mode, setMode] = useState<'move' | 'evm'>('move');
  const [code, setCode] = useState(defaultMove);
  const [privateKey, setPrivateKey] = useState('');
  const [result, setResult] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [resultType, setResultType] = useState<'success' | 'error' | ''>('');

  const handleToggle = (m: 'move' | 'evm') => {
    setMode(m);
    setCode(m === 'move' ? defaultMove : defaultSolidity);
    setResult('');
  };

  const handleDeploy = async () => {
    setResult('');
    setResultType('');
    if (!privateKey.trim()) {
      setResult('Lütfen private key girin.');
      setResultType('error');
      return;
    }
    setIsDeploying(true);
    if (mode === 'move') {
      if (!code.trim().startsWith('0x')) {
        setResult('Lütfen derlenmiş Move bytecode (0x ile başlayan hex) girin.');
        setResultType('error');
        setIsDeploying(false);
        return;
      }
      setResult('Deploy ediliyor...');
      const res = await deployMoveBytecode({ bytecodeHex: code.trim(), privateKey });
      if (res.success) {
        setResult(`Başarılı! Tx Hash: ${res.hash}`);
        setResultType('success');
      } else {
        setResult(`Hata: ${res.error}`);
        setResultType('error');
      }
    } else {
      setResult('Deploy ediliyor...');
      const res = await deployEvmContract({ code, privateKey });
      if (res.success) {
        setResult(`Başarılı! Kontrat adresi: ${res.address}`);
        setResultType('success');
      } else {
        setResult(`Hata: ${res.error}`);
        setResultType('error');
      }
    }
    setIsDeploying(false);
  };

  return (
    <Container>
      <Toggle>
        <ToggleButton active={mode === 'move'} onClick={() => handleToggle('move')}>MoveVM</ToggleButton>
        <ToggleButton active={mode === 'evm'} onClick={() => handleToggle('evm')}>EVM</ToggleButton>
      </Toggle>
      <CodeEditor
        value={code}
        language={mode === 'move' ? 'plaintext' : 'solidity'}
        onChange={setCode}
        placeholder={mode === 'move' ? 'Move Bytecode (0x...)' : 'Solidity Contract (pragma ile başlayın)'}
      />
      {mode === 'move' && (
        <div style={{ width: 500, color: '#b00', marginBottom: 8, fontSize: 14 }}>
          Uyarı: Move kontratını deploy etmek için <b>derlenmiş bytecode</b> (0x... ile başlayan hex) girmeniz gerekir.<br />
          <a href="https://docs.uminetwork.com/deploy-contract" target="_blank" rel="noopener noreferrer">Move kodunu derlemek için dokümana bakın</a>.
        </div>
      )}
      {mode === 'evm' && (
        <div style={{ width: 500, color: '#007aff', marginBottom: 8, fontSize: 14 }}>
          Solidity kontratınızı yazın ve deploy edin. <br />
          <a href="https://docs.uminetwork.com/deploy-evm-contract" target="_blank" rel="noopener noreferrer">EVM deploy dokümantasyonu</a>.
        </div>
      )}
      <Input
        type="password"
        placeholder="Private Key (0x... veya hex)"
        value={privateKey}
        onChange={e => setPrivateKey(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <DeployButton onClick={handleDeploy} disabled={isDeploying} style={{ opacity: isDeploying ? 0.6 : 1 }}>
        {isDeploying ? 'Deploy Ediliyor...' : 'Deploy'}
      </DeployButton>
      <Result success={resultType === 'success'} error={resultType === 'error'}>
        {result}
      </Result>
    </Container>
  );
};

export default App;
