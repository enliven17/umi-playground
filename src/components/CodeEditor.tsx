"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type CodeEditorProps = {
  code: string;
  onChange: (value: string) => void;
  language: 'move' | 'solidity';
};

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Her VM için ayrı state tutuyoruz
  const [moveCode, setMoveCode] = useState<string>('');
  const [moveFileName, setMoveFileName] = useState<string>('');
  const [evmCode, setEvmCode] = useState<string>('');
  const [evmFileName, setEvmFileName] = useState<string>('');

  const [modal, setModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

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

    processFile(file);
  };

  const processFile = (file: File) => {
    const MAX_FILE_SIZE = 1024 * 1024; // 1MB
    if (file.size > MAX_FILE_SIZE) {
      setModal({ open: true, message: `The uploaded file is too large. Maximum file size is 1MB.` });
      return;
    }
    // Dosya uzantısı kontrolü
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const expectedExtension = language === 'move' ? 'move' : 'sol';
    if (fileExtension !== expectedExtension) {
      setModal({ open: true, message: `Only .${expectedExtension} files are allowed.` });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const MAX_CODE_LENGTH = 50000; // 50KB
      if (content.length > MAX_CODE_LENGTH) {
        setModal({ open: true, message: `Code is too long. Maximum 50,000 characters allowed.` });
        return;
      }
      onChange(content);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
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
    <>
      {modal.open && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          margin: 0,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            padding: '28px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            minWidth: 280,
            maxWidth: 360,
            width: '90vw',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 500,
            color: '#222',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>⚠️</div>
            <div style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: '#222' }}>{modal.message}</div>
            <button
              onClick={() => setModal({ open: false, message: '' })}
              style={{
                background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 32px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(25,118,210,0.18)',
                marginTop: 8,
              }}
            >
              OK, got it
            </button>
          </div>
        </div>,
        typeof window !== 'undefined' ? document.body : null
      )}
      <div style={{ 
        margin: '0 auto', 
        maxWidth: '100%', 
        width: '100%', 
        borderRadius: 20, 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))', 
        boxShadow: '0 12px 40px 0 rgba(31,38,135,0.25)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255,255,255,0.3)',
        overflow: 'hidden'
      }}>
        {/* File Upload Controls */}
        <div style={{ 
          padding: '20px 24px 16px 24px', 
          display: 'flex', 
          gap: 12, 
          flexWrap: 'wrap', 
          alignItems: 'center',
          background: 'rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
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
              background: 'linear-gradient(135deg, #1976d2, #1565c0)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(25,118,210,0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(25,118,210,0.3)';
            }}
          >
            <span style={{ fontSize: 16 }}>📁</span>
            Upload {language === 'move' ? '.move' : '.sol'} File
          </button>
          <button
            onClick={handleClearCode}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#333',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 12,
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: 16 }}>🗑️</span>
            Clear
          </button>
          
          {/* File Name Display */}
          {fileName && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '10px 16px', 
              background: 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(76,175,80,0.1))', 
              borderRadius: 10, 
              border: '1px solid rgba(76,175,80,0.3)',
              marginLeft: 'auto',
              boxShadow: '0 2px 8px rgba(76,175,80,0.2)'
            }}>
              <span style={{ fontSize: 14, color: '#2e7d32' }}>📄</span>
              <span style={{ fontSize: 13, color: '#2e7d32', fontWeight: 600 }}>{fileName}</span>
            </div>
          )}
          
          <span style={{ 
            fontSize: 12, 
            color: '#666', 
            marginLeft: 'auto', 
            fontWeight: 500,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {language === 'move' ? 'Supports .move files' : 'Supports .sol files'} • Max 1MB
          </span>
        </div>
        
        {/* Code Preview Area */}
        <div style={{ padding: '20px 24px 24px 24px' }}>
          <div 
            style={{
              position: 'relative',
              borderRadius: 16,
              background: isDragOver ? 'rgba(25,118,210,0.1)' : 'rgba(255,255,255,0.1)',
              border: isDragOver ? '2px dashed rgba(25,118,210,0.5)' : '1px solid rgba(255,255,255,0.2)',
              overflow: 'hidden',
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Code Header */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.15)',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ff5f56',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
              }}></div>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ffbd2e',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
              }}></div>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#27ca3f',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
              }}></div>
              <span style={{
                marginLeft: 12,
                fontSize: 13,
                color: '#666',
                fontWeight: 500
              }}>
                {fileName || `${language === 'move' ? 'Move' : 'Solidity'} Contract Preview`}
              </span>
            </div>
            
            {/* Code Textarea with Custom Scrollbar */}
            <div style={{
              position: 'relative',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              <textarea
                value={code}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Upload a ${language === 'move' ? '.move' : '.sol'} file to see its content here...\n\n📄 Drag and drop or click "Upload File" to get started\n📏 Max file size: 1MB • Max code length: 50K characters`}
                readOnly
                style={{
                  width: '100%',
                  minHeight: '400px',
                  padding: '20px',
                  borderRadius: 0,
                  border: 'none',
                  background: 'transparent',
                  color: '#333',
                  fontSize: 14,
                  fontFamily: '"JetBrains Mono", "Fira Code", Monaco, Menlo, "Ubuntu Mono", monospace',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                cursor: 'default',
                letterSpacing: '0.3px'
              }}
            />
          </div>
        </div>
        
        {/* Status Bar */}
        <div style={{ 
          marginTop: '12px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px', 
          color: '#666'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10 }}>📄</span>
              {code ? `${code.split('\n').length} lines` : 'No content'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10 }}>📏</span>
              {code ? `${code.length.toLocaleString()}/50K chars` : '0/50K chars'}
            </span>
          </div>
          <span style={{ fontStyle: 'italic', opacity: 0.8 }}>
            Read-only preview
          </span>
        </div>
      </div>
    </div>
  </>);
};

export default CodeEditor;
