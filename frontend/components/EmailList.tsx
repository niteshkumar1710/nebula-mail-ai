'use client';
import React from 'react';
import { Email } from '../types';

interface EmailListProps {
  emails: Email[];
  onSelect: (email: Email) => void;
  title: string;
}

export default function EmailList({ emails, onSelect, title }: EmailListProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>{title}</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {emails.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No emails found.
          </div>
        ) : (
          emails.map(email => (
            <div 
              key={email.id}
              onClick={() => onSelect(email)}
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: email.read ? 'transparent' : 'var(--panel-bg)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = email.read ? 'transparent' : 'var(--panel-bg)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: email.read ? 400 : 600 }}>{email.sender}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{email.date}</span>
              </div>
              <div style={{ fontWeight: email.read ? 400 : 600, color: 'var(--text-primary)' }}>
                {email.subject}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email.snippet}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
