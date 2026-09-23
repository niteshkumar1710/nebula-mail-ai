'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';
import Compose from '../components/Compose';
import AIAssistant from '../components/AIAssistant';
import Login from '../components/Login';
import { AppState, ViewMode, Email } from '../types';

const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'Sarah Connor',
    recipients: ['me@example.com'],
    subject: 'Project Update',
    snippet: 'Here is the latest update on the project...',
    body: 'Here is the latest update on the project. We have completed the first phase successfully.',
    date: '10:30 AM',
    read: false,
  },
  {
    id: '2',
    sender: 'David Smith',
    recipients: ['me@example.com'],
    subject: 'Meeting Tomorrow',
    snippet: 'Let\'s meet at 3pm to discuss the new features.',
    body: 'Let\'s meet at 3pm to discuss the new features. Please bring the mockups.',
    date: 'Yesterday',
    read: true,
  }
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [state, setState] = useState<AppState>({
    currentView: 'inbox',
    currentEmail: null,
    composeState: { to: '', subject: '', body: '', mode: 'compose' },
    filters: {},
    emails: mockEmails,
    loading: false,
    error: null,
    assistantMessages: [
      { id: 'msg1', role: 'assistant', content: 'Hello! I am your AI assistant. I can help you send emails, search your inbox, and navigate.' }
    ]
  });

  useEffect(() => {
    // Check auth status
    fetch('http://localhost:8000/auth/status', {
      // In a real app we need credentials: 'include' if we use cookies across ports
    })
      .then(res => res.json())
      .then(data => {
        // For testing stage 3 without real credentials, we will just mock auth if backend is unreachable
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch auth status', err);
        setIsAuthenticated(false);
      });
  }, []);

  if (isAuthenticated === null) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const setView = (view: ViewMode) => {
    setState(s => ({ ...s, currentView: view, currentEmail: null }));
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
        body: `\n\nOn ${email.date}, ${email.sender} wrote:\n> ${email.body}`,
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

      {state.currentView === 'inbox' && (
        <EmailList 
          emails={state.emails} 
          onSelect={handleSelectEmail} 
          title="Inbox" 
        />
      )}
      
      {state.currentView === 'sent' && (
        <EmailList 
          emails={[]} 
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
            alert('Email sent! (mock)');
            setView('inbox');
          }}
          onDiscard={() => setView('inbox')}
        />
      )}

      <AIAssistant 
        messages={state.assistantMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
