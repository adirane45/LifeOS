import { prisma } from '../../lib/prisma';
import { getMoodEmoji, getEntriesOnThisDay } from '../../lib/journalHelpers';
import { revalidatePath } from 'next/cache';
import JournalEntryItem from '../../components/JournalEntryItem';

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
            <form action={addEntry} className="mt-4 space-y-3">
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
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                  No entries yet. Start writing!
                </div>
              ) : (
                entries.map((entry: any) => (
                  <div key={entry.id} className="space-y-2">
                    <JournalEntryItem
                      entry={entry}
                      onUpdate={updateEntry}
                    />
                    <form action={deleteEntry} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={String(entry.id)} />
                      <button type="submit" className="text-sm text-rose-600">Delete</button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 h-fit">
          <h3 className="text-sm font-medium">On this day</h3>
          <p className="text-xs text-gray-500 mt-1">In previous years</p>
          <ul className="mt-4 space-y-3">
            {onThisDayEntries.length === 0 ? (
              <li className="text-xs text-gray-500">No entries from previous years.</li>
            ) : (
              onThisDayEntries.map((entry: any) => (
                <li key={entry.id} className="border-l-2 border-gray-300 px-3 py-2">
                  <div className="text-xs font-medium text-gray-900">{entry.title}</div>
                  <div className="text-xs text-gray-500">{new Date(entry.date).getFullYear()}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}


