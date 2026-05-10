"use client";

import { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (e?: any) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
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
    <div className="flex h-full flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold">Assistant</h1>
        <p className="text-sm text-gray-500">Ask LifeOS about your finances, habits, health and journal.</p>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-gray-900">Hi! I'm your LifeOS assistant. Ask me about your finances, habits, health, or journal.</h3>
            <p className="max-w-sm text-sm text-gray-500">I can help summarize your app data, answer questions, and guide your next action.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`max-w-[80%] ${m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white text-gray-900'} rounded-xl p-3 shadow` }>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="text-sm text-gray-500">Assistant is typing</div>
          </div>
        )}
        {error && <div className="text-sm text-rose-600">{error}</div>}
      </div>

      <form onSubmit={send} className="p-4 border-t bg-white flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 rounded border px-3 py-2" />
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white">Send</button>
      </form>
    </div>
  );
}
