import React from 'react';

type ResultBoxProps = {
  result: string | null;
};

const ResultBox: React.FC<ResultBoxProps> = ({ result }) => {
  if (!result) return null;
  return (
    <div style={{ marginTop: 16, background: '#f6f8fa', borderRadius: 4, padding: 12, fontFamily: 'monospace', color: '#333', wordBreak: 'break-all' }}>
      {result}
    </div>
  );
};

export default ResultBox;
