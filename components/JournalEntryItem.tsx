'use client';

import { useState } from 'react';
import { getMoodEmoji } from '../lib/moodUtils';
import Button from './ui/Button';

export default function JournalEntryItem({ entry, onUpdate }: { entry: any; onUpdate?: (formData: FormData) => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [mood, setMood] = useState(entry.mood || '');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {isEditing ? (
        <form action={onUpdate} className="space-y-3">
          <input type="hidden" name="id" value={String(entry.id)} />
          <div>
            <label htmlFor={`entry-title-${entry.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Title</label>
            <input
              id={`entry-title-${entry.id}`}
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium w-full rounded border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
              placeholder="Entry title"
            />
          </div>
          <div>
            <label htmlFor={`entry-content-${entry.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Content</label>
            <textarea
              id={`entry-content-${entry.id}`}
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-32 w-full rounded border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
              placeholder="Entry content"
            />
          </div>
          <div>
            <label htmlFor={`entry-mood-${entry.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Mood (optional)</label>
            <input
              id={`entry-mood-${entry.id}`}
              name="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
              placeholder="e.g., happy, sad, calm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">Save</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium">{title}</h3>
              <div className="text-xs text-gray-500 mt-1">{new Date(entry.date).toLocaleString()}</div>
            </div>
            <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
          </div>
          <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">Edit</Button>
          </div>
        </div>
      )}
    </div>
  );
}
