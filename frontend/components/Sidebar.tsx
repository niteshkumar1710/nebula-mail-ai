'use client';
import React from 'react';
import { AppState, ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
}

export default function Sidebar({ currentView, setView }: SidebarProps) {
  return (
    <div style={{
      width: '240px',
      backgroundColor: 'var(--panel-bg)',
      borderRight: '1px solid var(--border-color)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-color)' }}>
        Nebula Mail
      </h2>
      
      <button 
        className="btn-secondary"
        style={{ 
          justifyContent: 'flex-start',
          backgroundColor: currentView === 'compose' ? 'var(--accent-color)' : 'var(--bg-color)',
          color: currentView === 'compose' ? 'white' : 'var(--text-primary)',
          marginBottom: '1rem'
        }}
        onClick={() => setView('compose')}
      >
        Compose
      </button>

      <button 
        className="btn-secondary"
        style={{ 
          justifyContent: 'flex-start',
          backgroundColor: currentView === 'inbox' ? 'var(--hover-bg)' : 'transparent',
        }}
        onClick={() => setView('inbox')}
      >
        Inbox
      </button>

      <button 
        className="btn-secondary"
        style={{ 
          justifyContent: 'flex-start',
          backgroundColor: currentView === 'sent' ? 'var(--hover-bg)' : 'transparent',
        }}
        onClick={() => setView('sent')}
      >
        Sent
      </button>
    </div>
  );
}
