import { prisma } from '../../lib/prisma';
import { getMoodEmoji, getEntriesOnThisDay } from '../../lib/journalHelpers';
import { revalidatePath } from 'next/cache';
import { BookOpen } from 'lucide-react';
import JournalEntryItem from '../../components/JournalEntryItem';
import EmptyState from '../../components/EmptyState';
import ConfirmDeleteForm from '../../components/ConfirmDeleteForm';

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const userId = 1; // Hardcoded for now; use auth in production
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const now = new Date();
  const onThisDayEntries = await getEntriesOnThisDay(userId, now.getMonth(), now.getDate());

  async function addEntry(formData: FormData) {
    'use server';
    const title = String(formData.get('title') ?? '');
    const content = String(formData.get('content') ?? '');
    const mood = String(formData.get('mood') ?? '');
    const date = new Date(String(formData.get('date') ?? new Date().toISOString()));

    await prisma.journalEntry.create({
      data: { userId, title, content, mood: mood || null, date }
    });
    revalidatePath('/journal');
  }

  async function updateEntry(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const title = String(formData.get('title') ?? '');
    const content = String(formData.get('content') ?? '');
    const mood = String(formData.get('mood') ?? '');

    await prisma.journalEntry.update({
      where: { id },
      data: { title, content, mood: mood || null }
    });
    revalidatePath('/journal');
  }

  async function deleteEntry(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    await prisma.journalEntry.delete({ where: { id } });
    revalidatePath('/journal');
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Journal</h2>
        <p className="text-sm text-gray-500">Capture your thoughts and reflect on life.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_250px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-lg font-medium">New entry</h3>
            <form id="new-entry" action={addEntry} className="mt-4 space-y-3">
              <div>
                <label className="text-sm">Title</label>
                <input name="title" placeholder="Entry title" className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">Content</label>
                <textarea name="content" rows={5} placeholder="Write your thoughts..." className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">Mood (optional)</label>
                <input name="mood" placeholder="e.g., happy, thoughtful, peaceful" className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">Date</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded border px-3 py-2" />
              </div>
              <div>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Save entry</button>
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">All entries</h3>
            <div className="space-y-4">
              {entries.length === 0 ? (
                <EmptyState icon={<BookOpen />} title="No journal entries yet." description="Write your first note to start journaling." actionLabel="Write a note" actionHref="#new-entry" />
              ) : (
                entries.map((entry: any) => (
                  <div key={entry.id} className="space-y-2">
                    <JournalEntryItem
                      entry={entry}
                      onUpdate={updateEntry}
                    />
                    <ConfirmDeleteForm
                      action={deleteEntry}
                      itemId={entry.id}
                      title="Delete journal entry?"
                      message="Deleting this journal entry will permanently remove it. This cannot be undone."
                      confirmLabel="Delete entry"
                      triggerLabel="Delete"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 h-fit">
          <h3 className="text-sm font-medium">On This Day</h3>
          <p className="text-xs text-gray-500 mt-1">In previous years</p>
          <div className="mt-4">
            {onThisDayEntries.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                📅 No entries from past years on this day. Write your first memory today!
              </div>
            ) : (
              <ul className="space-y-3">
                {onThisDayEntries.map((entry: any) => (
                  <li key={entry.id} className="border-l-2 border-gray-300 px-3 py-2">
                    <div className="text-xs font-medium text-gray-900">{entry.title}</div>
                    <div className="text-xs text-gray-500">{new Date(entry.date).getFullYear()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


