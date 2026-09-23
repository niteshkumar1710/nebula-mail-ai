'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';
import Compose from '../components/Compose';
import AIAssistant from '../components/AIAssistant';
import Login from '../components/Login';
import { AppState, ViewMode, Email } from '../types';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [state, setState] = useState<AppState>({
    currentView: 'inbox',
    currentEmail: null,
    composeState: { to: '', subject: '', body: '', mode: 'compose' },
    filters: {},
    emails: [],
    loading: true, // Start loading as true while fetching auth
    error: null,
    assistantMessages: [
      { id: 'msg1', role: 'assistant', content: 'Hello! I am your AI assistant. I can help you send emails, search your inbox, and navigate.' }
    ]
  });

  const fetchEmails = useCallback(async (view: ViewMode) => {
    if (view !== 'inbox' && view !== 'sent') return;
    
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const label = view === 'inbox' ? 'INBOX' : 'SENT';
      const res = await fetch(`http://localhost:8000/api/messages?label=${label}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setState(s => ({ ...s, emails: data.emails || [], loading: false }));
    } catch (err: any) {
      console.error(err);
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/auth/status', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(!!data.authenticated);
        if (data.authenticated) {
          fetchEmails('inbox');
        }
      })
      .catch(err => {
        console.error('Failed to fetch auth status', err);
        setIsAuthenticated(false);
      });
  }, [fetchEmails]);

  if (isAuthenticated === null) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const setView = (view: ViewMode) => {
    setState(s => ({ ...s, currentView: view, currentEmail: null }));
    if (view === 'inbox' || view === 'sent') {
      fetchEmails(view);
    }
  };

  const handleSelectEmail = (email: Email) => {
    setState(s => ({
      ...s,
      currentView: 'detail',
      currentEmail: { ...email, read: true },
      emails: s.emails.map(e => e.id === email.id ? { ...e, read: true } : e)
    }));
  };

  const handleReply = (email: Email) => {
    setState(s => ({
      ...s,
      currentView: 'compose',
      composeState: {
        to: email.sender,
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        body: `\n\nOn ${email.date}, ${email.sender} wrote:\n> ${email.body.replace(/\n/g, '\n> ')}`,
        mode: 'reply',
        replyToEmailId: email.id
      }
    }));
  };

  const handleSendMessage = (msg: string) => {
    const newMsg = { id: Date.now().toString(), role: 'user' as const, content: msg };
    setState(s => ({
      ...s,
      assistantMessages: [...s.assistantMessages, newMsg]
    }));
    
    setTimeout(() => {
      setState(s => ({
        ...s,
        assistantMessages: [...s.assistantMessages, { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: 'I am a placeholder AI. The real Gemini integration will be added in Stage 7.' 
        }]
      }));
    }, 1000);
  };

  return (
    <div className="layout-container">
      <Sidebar 
        currentView={state.currentView} 
        setView={setView} 
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {state.loading && state.currentView !== 'compose' && state.currentView !== 'detail' && (
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
            Loading emails...
          </div>
        )}
        
        {state.error && (
          <div style={{ padding: '1rem', color: 'white', backgroundColor: 'var(--danger-color)' }}>
            {state.error}
          </div>
        )}

        {state.currentView === 'inbox' && !state.loading && (
          <EmailList 
            emails={state.emails} 
            onSelect={handleSelectEmail} 
            title="Inbox" 
          />
        )}
        
        {state.currentView === 'sent' && !state.loading && (
          <EmailList 
            emails={state.emails} 
            onSelect={handleSelectEmail} 
            title="Sent" 
          />
        )}

        {state.currentView === 'detail' && state.currentEmail && (
          <EmailDetail 
            email={state.currentEmail} 
            onBack={() => setView('inbox')}
            onReply={handleReply}
          />
        )}

        {state.currentView === 'compose' && (
          <Compose 
            initialState={state.composeState}
            onSend={(composeData) => {
              alert('Email sending is coming in Stage 6! (mock)');
              setView('inbox');
            }}
            onDiscard={() => setView('inbox')}
          />
        )}
      </div>

      <AIAssistant 
        messages={state.assistantMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
