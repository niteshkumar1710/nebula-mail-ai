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
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setState(s => ({ ...s, error: msg, loading: false }));
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
        body: `\n\nOn ${email.date}, ${email.sender} wrote:\n> ${(email.body || email.snippet || '').replace(/\\n/g, '\n> ')}`,
        mode: 'reply',
        replyToEmailId: email.id
      }
    }));
  };

  const handleSendMessage = async (msg: string) => {
    const newMsg = { id: Date.now().toString(), role: 'user' as const, content: msg };
    setState(s => ({
      ...s,
      assistantMessages: [...s.assistantMessages, newMsg]
    }));
    
    try {
      // Build context string from current view
      let contextStr = `Current View: ${state.currentView}`;
      if (state.currentView === 'compose') {
        contextStr += `\nCurrently composing draft: To: ${state.composeState.to}, Subject: ${state.composeState.subject}, Body: ${state.composeState.body}, Mode: ${state.composeState.mode}, ReplyToEmailId: ${state.composeState.replyToEmailId || 'none'}`;
      } else if (state.currentEmail && state.currentView === 'detail') {
        contextStr += `\nCurrently looking at Email ID: ${state.currentEmail.id}\nFrom: ${state.currentEmail.sender}\nSubject: ${state.currentEmail.subject}\nBody:\n${state.currentEmail.body}`;
      } else if (state.emails.length > 0) {
        contextStr += `\nUser has ${state.emails.length} emails in the list. First few subjects:\n${state.emails.slice(0,3).map(e => e.subject).join('\n')}`;
      }

      const res = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          message: msg, 
          context: contextStr,
          history: state.assistantMessages.map(m => ({ role: m.role, content: m.content })) 
        })
      });

      if (!res.ok) throw new Error('Failed to get AI response');
      const data = await res.json();
      
      // Handle UI Actions
      if (data.ui_action === 'open_compose' || data.ui_action === 'fill_compose') {
        const payload = data.ui_action_payload || {};
        setState(s => ({
          ...s,
          currentView: 'compose',
          composeState: {
            ...s.composeState,
            to: payload.to || s.composeState.to,
            subject: payload.subject || s.composeState.subject,
            body: payload.body || s.composeState.body,
            mode: payload.reply_to_email_id ? 'reply' : 'compose',
            replyToEmailId: payload.reply_to_email_id || s.composeState.replyToEmailId
          }
        }));
      }

      setState(s => ({
        ...s,
        assistantMessages: [...s.assistantMessages, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: data.assistant_message || 'No response.' 
        }]
      }));
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setState(s => ({
        ...s,
        assistantMessages: [...s.assistantMessages, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${msg}` 
        }]
      }));
    }
  };

  return (
    <div className="layout-container">
      <Sidebar 
        currentView={state.currentView} 
        setView={setView} 
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
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
            key={JSON.stringify(state.composeState)}
            initialState={state.composeState}
            onSend={async (composeData) => {
              setState(s => ({ ...s, loading: true }));
              try {
                const res = await fetch('http://localhost:8000/api/messages/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    to: composeData.to,
                    subject: composeData.subject,
                    body: composeData.body,
                    reply_to_email_id: composeData.replyToEmailId
                  })
                });
                
                if (!res.ok) throw new Error('Failed to send email');
                alert('Email sent successfully!');
                setView('inbox');
              } catch (err: unknown) {
                console.error(err);
                const msg = err instanceof Error ? err.message : String(err);
                alert('Error sending email: ' + msg);
                setState(s => ({ ...s, loading: false }));
              }
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
