'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import ConfirmDialog from '../ConfirmDialog';
import { clearHistory, saveMessage } from '../../app/assistant/actions';
import AssistantChatComposer from './AssistantChatComposer';
import AssistantChatFeed from './AssistantChatFeed';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

type AssistantChatClientProps = {
  initialMessages: Message[];
};

export default function AssistantChatClient({ initialMessages }: AssistantChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  const send = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Assistant request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream from assistant');

      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages((current) => [...current, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parts = chunk.split(/\n\n/);
        for (const part of parts) {
          if (!part.trim()) continue;

          const line = part.replace(/^data:\s*/, '').trim();
          if (!line || line === '[DONE]') continue;

          try {
            const parsed = JSON.parse(line) as { token?: string; content?: string };
            const token = parsed.token ?? parsed.content;
            if (!token) continue;

            assistantText += token;
            setMessages((current) => {
              const next = [...current];
              const lastAssistantIndex = next.map((entry) => entry.role).lastIndexOf('assistant');
              if (lastAssistantIndex >= 0) {
                next[lastAssistantIndex] = { role: 'assistant', content: assistantText };
              }
              return next;
            });
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }

      try {
        await Promise.all([
          saveMessage('user', trimmed),
          saveMessage('assistant', assistantText || 'I am ready to help.')
        ]);
      } catch (persistError) {
        toast.error('Could not save this conversation, but chat is still available.');
        console.error('Failed to persist assistant conversation:', persistError);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfirmed = async () => {
    try {
      await clearHistory();
      setMessages([]);
      setError(null);
      setClearDialogOpen(false);
      toast.success('Chat cleared');
    } catch {
      toast.error('Could not clear chat history.');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assistant</h1>
            <p className="text-sm text-gray-600 dark:text-gray-500">Ask LifeOS about your finances, habits, health and journal.</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            onClick={() => setClearDialogOpen(true)}
            aria-label="Clear chat history"
            disabled={!hasMessages || loading}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear chat</span>
          </Button>
        </div>
      </div>

      <AssistantChatFeed messages={messages} loading={loading} error={error} />
      <AssistantChatComposer loading={loading} onSend={send} autoFocus />

      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearConfirmed}
        title="Clear chat history?"
        message="This will remove the saved conversation from your LifeOS database and reset the chat view."
        confirmLabel="Clear chat"
        variant="danger"
      />
    </div>
  );
}