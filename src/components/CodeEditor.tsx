"use client";
import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('react-monaco-editor'), { ssr: false });

type CodeEditorProps = {
  code: string;
  onChange: (value: string) => void;
  language: 'move' | 'solidity';
};

const EXAMPLES = {
  move: `module example::Counter {
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
}
`,
  solidity: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\ncontract Counter {\n    uint public value;\n    function increment() public {\n        value += 1;\n    }\n}\n`,
};

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language }) => {
  useEffect(() => {
    if (!code) {
      onChange(EXAMPLES[language]);
    }
    // eslint-disable-next-line
  }, [language]);
  return (
    <div style={{ margin: '0 auto', maxWidth: 900, width: '100%', borderRadius: 18, background: 'rgba(255,255,255,0.15)', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
      <MonacoEditor
        width="100%"
        height="400"
        language={language === 'move' ? 'plaintext' : 'solidity'}
        theme="vs-dark"
        value={code}
        options={{ fontSize: 16, minimap: { enabled: false }, fontFamily: 'Fira Mono, monospace' }}
        onChange={(val) => onChange(typeof val === 'string' ? val : '')}
      />
    </div>
  );
};
export default CodeEditor;
