import { prisma } from '../../lib/prisma';
import { getMoodEmoji } from '../../lib/journalHelpers';
import { revalidatePath } from 'next/cache';
import { BookOpen } from 'lucide-react';
import JournalEntryItem from '../../components/JournalEntryItem';
import EmptyState from '../../components/EmptyState';
import ConfirmDeleteForm from '../../components/ConfirmDeleteForm';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getJournalEntries } from '../../lib/data';

export const revalidate = 60;

export default async function JournalPage() {
  const userId = 1; // Hardcoded for now; use auth in production
  const allEntries = await getJournalEntries(userId, 200);
  const entries = allEntries.slice(0, 20);

  const now = new Date();
  const onThisDayEntries = allEntries.filter((entry: any) => {
    const date = new Date(entry.date);
    return date.getMonth() === now.getMonth() && date.getDate() === now.getDate() && date.getFullYear() !== now.getFullYear();
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Journal</h2>
          <p className="text-sm text-gray-500">Capture your thoughts and reflect on life.</p>
        </div>
        <Button href="/api/export/journal" download variant="secondary" className="inline-flex items-center justify-center">Export CSV</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_250px]">
        <div className="space-y-6">
          <Card className="p-0">
            <div className="p-4">
              <h3 className="text-lg font-semibold">New entry</h3>
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
                <Button type="submit" variant="primary">Save entry</Button>
              </div>
            </form>
            </div>
          </Card>

          <div>
            <h3 className="text-lg font-semibold mb-4">All entries</h3>
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

        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold">On This Day</h3>
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
        </Card>
      </div>
    </section>
  );
}


