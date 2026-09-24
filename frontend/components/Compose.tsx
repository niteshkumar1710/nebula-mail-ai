'use client';
import React, { useState } from 'react';
import { ComposeState } from '../types';

interface ComposeProps {
  initialState: ComposeState;
  onSend: (state: ComposeState) => void;
  onDiscard: () => void;
}

export default function Compose({ initialState, onSend, onDiscard }: ComposeProps) {
  const [state, setState] = useState<ComposeState>(initialState);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>
          {state.mode === 'reply' ? 'Reply' : 'New Message'}
        </h2>
      </div>
      
      <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>To</label>
          <input 
            value={state.to}
            onChange={e => setState({ ...state, to: e.target.value })}
            placeholder="recipient@example.com"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Subject</label>
          <input 
            value={state.subject}
            onChange={e => setState({ ...state, subject: e.target.value })}
            placeholder="Subject"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Message</label>
          <textarea 
            value={state.body}
            onChange={e => setState({ ...state, body: e.target.value })}
            style={{ flex: 1, resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={onDiscard}>Discard</button>
          <button className="btn-primary" onClick={() => onSend(state)}>Send</button>
        </div>
      </div>
    </div>
  );
}
