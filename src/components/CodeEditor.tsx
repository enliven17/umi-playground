"use client";

import React, { useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';

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
  solidity: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Counter {
    uint public value;
    function increment() public {
        value += 1;
    }
}
`,
};

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language }) => {
  useEffect(() => {
    if (!code) {
      onChange(EXAMPLES[language]);
    }
    // eslint-disable-next-line
  }, [language]);
  return (
    <div style={{ margin: '0 auto', maxWidth: 900, width: '100%' }}>
      <MonacoEditor
        width="100%"
        height="600"
        language={language === 'move' ? 'plaintext' : 'solidity'}
        theme="vs-dark"
        value={code}
        options={{ fontSize: 16, minimap: { enabled: false } }}
        onChange={(val) => onChange(typeof val === 'string' ? val : '')}
      />
    </div>
  );
};
export default CodeEditor;
