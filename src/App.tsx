import React, { useEffect, useState, ChangeEvent } from 'react';

declare global {
  interface Window {
    api: {
      onFileLoaded: (callback: (content: string) => void) => void;
      onFileChanged: (callback: (content: string) => void) => void;
      saveFile: (content: string) => void;
    };
  }
}

export default function App() {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    window.api.onFileLoaded((content: string) => setText(content));
    window.api.onFileChanged((content: string) => setText(content));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    window.api.saveFile(newText);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100%',
      margin: 0, 
      padding: 0, 
      overflow: 'hidden', 
      backgroundColor: '#ffffff' 
    }}>
      <textarea
        value={text}
        onChange={handleChange}
        spellCheck={false}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: '5px',
          boxSizing: 'border-box',
          fontFamily: 'Consolas, monospace',
          fontSize: '15px',
          backgroundColor: '#ffffff',
          color: '#333333',
          margin: 0,
          display: 'block',
          overflowX: 'hidden',
          overflowY: 'auto'
        }}
      />
    </div>
  );
}