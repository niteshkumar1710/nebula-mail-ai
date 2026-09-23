'use client';
import React, { useState } from 'react';
import { AppState } from '../types';

interface AIAssistantProps {
  messages: AppState['assistantMessages'];
  onSendMessage: (message: string) => void;
}

export default function AIAssistant({ messages, onSendMessage }: AIAssistantProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div style={{
      width: '320px',
      backgroundColor: 'var(--panel-bg)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI Assistant</h2>
      </div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
            I can help you search emails, compose messages, and navigate. How can I assist you?
          </div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? 'var(--accent-color)' : 'var(--hover-bg)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                maxWidth: '85%',
                lineHeight: 1.5
              }}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
