'use client';

import FormSubmitWrapper from '../FormSubmitWrapper';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../EmptyState';
import { AlertCircle, Bell, Clock3 } from 'lucide-react';

type ReminderAction = (formData: FormData) => Promise<void>;

type ReminderContact = {
  id: number;
  name: string;
  relationship: string | null;
  lastContacted: string | null;
  remindAfterDays: number;
  overdueDays: number;
};

function formatDate(value: string | null) {
  if (!value) {
    return 'Never contacted';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Never contacted';
  }

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ContactRemindersClient({
  contacts,
  markContacted,
  snoozeReminder
}: {
  contacts: ReminderContact[];
  markContacted: ReminderAction;
  snoozeReminder: ReminderAction;
}) {
  return (
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Contacts</p>
          <h2 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">Reminders</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Catch up with people you haven&apos;t spoken to recently.</p>
        </div>
        <Button href="/contacts" variant="secondary" className="inline-flex items-center justify-center">Back to Contacts</Button>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="All caught up!"
          description="No follow-up reminders are currently due."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-0">
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.relationship || 'Unassigned'}</p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {contact.overdueDays > 0 ? `${contact.overdueDays} day${contact.overdueDays === 1 ? '' : 's'} overdue` : 'Due now'}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Last contacted: {formatDate(contact.lastContacted)}</p>
                  <p>Reminder cadence: every {contact.remindAfterDays} day{contact.remindAfterDays === 1 ? '' : 's'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <FormSubmitWrapper
                    action={markContacted}
                    successMessage="Marked as contacted!"
                    errorMessage="Failed to update contact"
                  >
                    <input type="hidden" name="id" value={String(contact.id)} />
                    <Button type="submit" variant="primary" className="inline-flex items-center justify-center gap-1.5 text-sm">
                      <Clock3 className="h-4 w-4" />
                      Mark as Contacted
                    </Button>
                  </FormSubmitWrapper>

                  <FormSubmitWrapper
                    action={snoozeReminder}
                    successMessage="Reminder snoozed"
                    errorMessage="Failed to snooze reminder"
                  >
                    <input type="hidden" name="id" value={String(contact.id)} />
                    <div className="flex items-center gap-2">
                      <label htmlFor={`snooze-${contact.id}`} className="sr-only">Snooze days</label>
                      <input
                        id={`snooze-${contact.id}`}
                        type="number"
                        name="days"
                        min="1"
                        step="1"
                        defaultValue="3"
                        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />
                      <Button type="submit" variant="secondary" className="text-sm">Snooze</Button>
                    </div>
                  </FormSubmitWrapper>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button href={`/contacts#contact-${contact.id}`} variant="ghost" className="inline-flex items-center justify-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    View full contact
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}