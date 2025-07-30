"use client";
import React, { useEffect, useRef, useState } from 'react';

type CodeEditorProps = {
  code: string;
  onChange: (value: string) => void;
  language: 'move' | 'solidity';
};

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  
  // Her VM için ayrı state tutuyoruz
  const [moveCode, setMoveCode] = useState<string>('');
  const [moveFileName, setMoveFileName] = useState<string>('');
  const [evmCode, setEvmCode] = useState<string>('');
  const [evmFileName, setEvmFileName] = useState<string>('');

  useEffect(() => {
    // Language değiştiğinde ilgili state'i yükle
    if (language === 'move') {
      setFileName(moveFileName);
      onChange(moveCode);
    } else {
      setFileName(evmFileName);
      onChange(evmCode);
    }
  }, [language, onChange, moveCode, moveFileName, evmCode, evmFileName]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya adını kaydet
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onChange(content);
      
      // İlgili VM'in state'ini güncelle
      if (language === 'move') {
        setMoveCode(content);
        setMoveFileName(file.name);
      } else {
        setEvmCode(content);
        setEvmFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleClearCode = () => {
    onChange('');
    setFileName('');
    
    // İlgili VM'in state'ini temizle
    if (language === 'move') {
      setMoveCode('');
      setMoveFileName('');
    } else {
      setEvmCode('');
      setEvmFileName('');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ margin: '0 auto', maxWidth: '100%', width: '100%', borderRadius: 18, background: 'rgba(255,255,255,0.15)', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
      {/* File Upload Controls */}
      <div style={{ padding: '16px 20px 0 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={language === 'move' ? '.move' : '.sol'}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'linear-gradient(135deg, rgba(25,118,210,0.9), rgba(25,118,210,0.7))',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(25,118,210,0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(25,118,210,0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,118,210,0.3)';
          }}
        >
          📁 Upload {language === 'move' ? '.move' : '.sol'} File
        </button>
        <button
          onClick={handleClearCode}
          style={{
            background: 'rgba(255,255,255,0.4)',
            color: '#333',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '10px 18px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
          🗑️ Clear
        </button>
        
        {/* File Name Display */}
        {fileName && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '8px 12px', 
            background: 'rgba(76,175,80,0.2)', 
            borderRadius: 6, 
            border: '1px solid rgba(76,175,80,0.3)',
            marginLeft: 'auto'
          }}>
            <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>📄</span>
            <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 500 }}>{fileName}</span>
          </div>
        )}
        
        <span style={{ fontSize: 12, color: '#666', marginLeft: 'auto', fontWeight: 500 }}>
          {language === 'move' ? 'Supports .move files' : 'Supports .sol files'}
        </span>
      </div>
      
      {/* Simple Textarea */}
      <div style={{ padding: '16px 20px 20px 20px' }}>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Upload a ${language === 'move' ? '.move' : '.sol'} file to see its content here...`}
          readOnly
          style={{
            width: '100%',
            minHeight: '400px',
            padding: '16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.15)',
            color: '#333',
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineHeight: '1.5',
            resize: 'vertical',
            outline: 'none',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(4px)',
            cursor: 'default'
          }}
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '12px', 
          color: '#666', 
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          📄 File content preview - Upload a file to see the code
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
