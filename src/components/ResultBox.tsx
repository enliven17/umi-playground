import React from 'react';

type ResultBoxProps = {
  result: any | null;
};

const ResultBox: React.FC<ResultBoxProps> = ({ result }) => {
  if (!result) return null;

  // Parse result if it's a string
  let parsedResult;
  try {
    parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
  } catch {
    parsedResult = { message: result };
  }

  // Determine if it's a success or error message
  const isSuccess = parsedResult.message?.includes('successfully') || 
                   parsedResult.message?.includes('Deploying') ||
                   (!parsedResult.error && !parsedResult.message?.includes('failed'));

  return (
    <div style={{ 
      marginTop: 16, 
      background: 'rgba(255,255,255,0.15)', 
      borderRadius: 12, 
      padding: 20, 
      fontFamily: 'monospace', 
      color: '#333', 
      wordBreak: 'break-all',
      boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.25)'
    }}>
      {/* Success/Error Message */}
      <div style={{ 
        marginBottom: 16, 
        padding: '12px 16px', 
        borderRadius: 8,
        background: isSuccess 
          ? 'rgba(76,175,80,0.2)' 
          : 'rgba(244,67,54,0.2)',
        border: `1px solid ${isSuccess ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`,
        color: isSuccess ? '#2e7d32' : '#d32f2f',
        fontWeight: 600
      }}>
        {parsedResult.message}
      </div>

      {/* Contract Address */}
      {parsedResult.contractAddress && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>📋 Contract Address:</div>
          <div style={{ 
            padding: '8px 12px', 
            background: 'rgba(25,118,210,0.1)', 
            borderRadius: 6, 
            border: '1px solid rgba(25,118,210,0.2)',
            fontFamily: 'monospace',
            fontSize: 14
          }}>
            {parsedResult.contractAddress}
          </div>
        </div>
      )}

      {/* Transaction Hash */}
      {parsedResult.transactionHash && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>🔗 Transaction Hash:</div>
          <div style={{ 
            padding: '8px 12px', 
            background: 'rgba(25,118,210,0.1)', 
            borderRadius: 6, 
            border: '1px solid rgba(25,118,210,0.2)',
            fontFamily: 'monospace',
            fontSize: 14
          }}>
            {parsedResult.transactionHash}
          </div>
        </div>
      )}

      {/* Rate Limit Info */}
      {parsedResult.rateLimitRemaining !== undefined && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: '#666', marginBottom: 4 }}>⏱️ Rate Limit:</div>
          <div style={{ 
            padding: '8px 12px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: 6, 
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: 14
          }}>
            {parsedResult.rateLimitRemaining} requests remaining
            {parsedResult.rateLimitResetIn && (
              <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                (resets in {parsedResult.rateLimitResetIn}s)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Full Output (if available) */}
      {parsedResult.fullOutput && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontWeight: 600, 
            color: '#666',
            padding: '8px 0'
          }}>
            📄 View Full Output
          </summary>
          <div style={{ 
            marginTop: 8, 
            padding: 12, 
            background: 'rgba(0,0,0,0.05)', 
            borderRadius: 6,
            fontSize: 12,
            maxHeight: 200,
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {parsedResult.fullOutput}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
};

export default ResultBox;
