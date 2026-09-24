'use client';
import React from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Email } from '../types';

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onReply: (email: Email) => void;
}

export default function EmailDetail({ email, onBack, onReply }: EmailDetailProps) {
  const content = email.body || email.snippet || '';
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  const renderContent = () => {
    if (isHtml) {
      const sanitizedHtml = DOMPurify.sanitize(content, {
        ADD_ATTR: ['target']
      });
      return (
        <div 
          className="email-html-content"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
          style={{ 
            lineHeight: 1.6, 
            backgroundColor: 'white', 
            color: 'black', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            overflowX: 'auto',
            minHeight: '200px'
          }} 
        />
      );
    }
    
    return (
      <div style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {content}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflowY: 'auto' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn-secondary" onClick={() => onReply(email)}>Reply</button>
      </div>
      
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>{email.subject}</h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{email.sender}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>to {email.recipients.join(', ')}</div>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {email.date}
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
