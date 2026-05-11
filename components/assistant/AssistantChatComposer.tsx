"use client";

import { type FormEvent, useState } from 'react';
import Button from '../ui/Button';

export default function AssistantChatComposer({ loading, onSend }: { loading: boolean; onSend: (content: string) => Promise<void> | void }) {
  const [input, setInput] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');
    await onSend(content);
  };

  return (
    <form onSubmit={submit} className="flex gap-2 border-t bg-white p-4">
      <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a message..." className="flex-1 rounded border px-3 py-2" />
      <Button type="submit" disabled={loading} variant="primary">Send</Button>
    </form>
  );
}
