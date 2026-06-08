import React, { useEffect, useState, ChangeEvent, useRef } from 'react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    window.api.onFileLoaded((content: string) => setText(content));
    
    window.api.onFileChanged((newText: string) => {
      setText((prevText) => {
        const isAppendAtBottom = newText.startsWith(prevText) && newText.length > prevText.length;

        if (isAppendAtBottom) {
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
            }
          }, 0);
        }

        return newText;
      });
    });
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
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
      `}</style>
      <textarea
        ref={textareaRef}
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