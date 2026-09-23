export type ViewMode = 'inbox' | 'sent' | 'detail' | 'compose';

export interface Email {
  id: string;
  sender: string;
  recipients: string[];
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  read: boolean;
}

export interface ComposeState {
  to: string;
  subject: string;
  body: string;
  mode: 'compose' | 'reply';
  replyToEmailId?: string;
}

export interface FilterState {
  dateFrom?: string;
  dateTo?: string;
  sender?: string;
  keyword?: string;
  unread?: boolean;
}

export interface AppState {
  currentView: ViewMode;
  currentEmail: Email | null;
  composeState: ComposeState;
  filters: FilterState;
  emails: Email[];
  loading: boolean;
  error: string | null;
  assistantMessages: { id: string; role: 'user' | 'assistant'; content: string }[];
}
