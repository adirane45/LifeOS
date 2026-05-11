"use client";

import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export default function AssistantChatFeed({ messages, loading, error }: { messages: Message[]; loading: boolean; error: string | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto space-y-4 bg-gray-50 p-4">
      {messages.length === 0 && !loading ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
            <Bot className="h-8 w-8" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Hi! I'm your LifeOS assistant. Ask me about your finances, habits, health, or journal.</h3>
          <p className="max-w-sm text-sm text-gray-500">I can help summarize your app data, answer questions, and guide your next action.</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <div key={index} className={`max-w-[80%] rounded-xl p-3 shadow ${message.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white text-gray-900'}`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
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
  );
}
