"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Bot } from 'lucide-react';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const AssistantChatFeed = dynamic(() => import('../../components/assistant/AssistantChatFeed'), {
  ssr: false,
  loading: () => <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">Loading chat…</div>
});

const AssistantChatComposer = dynamic(() => import('../../components/assistant/AssistantChatComposer'), {
  ssr: false,
  loading: () => <div className="border-t bg-white p-4 text-sm text-gray-500">Loading composer…</div>
});

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Assistant request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream from assistant');

      const decoder = new TextDecoder();
      let assistantText = '';
      // add placeholder assistant message while streaming
      setMessages((m) => [...m, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Cohere stream uses lines like: data: {"token":"text"}\n\n or data: [DONE]\n\n
        const parts = chunk.split(/\n\n/);
        for (const part of parts) {
          if (!part.trim()) continue;
          const line = part.replace(/^data:\s*/, '').trim();
            if (!line) continue;
            if (line === '[DONE]') continue;
          try {
            const parsed = JSON.parse(line);
              const token = parsed.token ?? parsed.content;
              if (token) {
                assistantText += token;
              setMessages((m) => {
                const copy = [...m];
                // update last assistant message
                const lastIndex = copy.map((x) => x.role).lastIndexOf('assistant');
                if (lastIndex >= 0) copy[lastIndex] = { role: 'assistant', content: assistantText };
                return copy;
              });
            }
          } catch (err) {
            // ignore parse errors
          }
        }
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || String(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">Assistant</h1>
        <p className="text-sm text-gray-600 dark:text-gray-500">Ask LifeOS about your finances, habits, health and journal.</p>
      </div>
      <AssistantChatFeed messages={messages} loading={loading} error={error} />
      <AssistantChatComposer loading={loading} onSend={send} autoFocus />
    </div>
  );
}
