import React from 'react';
import MonacoEditor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange, placeholder }) => {
  return (
    <MonacoEditor
      height="250px"
      width="500px"
      language={language}
      value={value}
      theme="vs-light"
      options={{ fontSize: 16, minimap: { enabled: false }, automaticLayout: true, fontFamily: 'Fira Mono, monospace', roundedSelection: false, placeholder }}
      onChange={(v: any) => onChange(v || '')}
    />
  );
};

export default CodeEditor;
