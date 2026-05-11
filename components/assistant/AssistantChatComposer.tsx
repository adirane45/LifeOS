"use client";

import { type FormEvent, useRef, useEffect, useState } from 'react';
import Button from '../ui/Button';

export default function AssistantChatComposer({ loading, onSend, autoFocus }: { loading: boolean; onSend: (content: string) => Promise<void> | void; autoFocus?: boolean }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');
    await onSend(content);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t bg-white p-4 sm:flex-row sm:items-center">
      <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a message..." aria-label="Chat message input" className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      <Button type="submit" disabled={loading} variant="primary" className="w-full sm:w-auto">Send</Button>
    </form>
  );
}
