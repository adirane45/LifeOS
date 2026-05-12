'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, CalendarDays, PencilLine, Plus, Search, Users } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../EmptyState';
import ConfirmDialog from '../ConfirmDialog';
import FormSubmitWrapper from '../FormSubmitWrapper';
import { getContactAttentionAge, getDaysSince, getNextBirthdayInfo, normalizeImportantDates, type ContactRecord } from '../../lib/contactHelpers';

type ContactAction = (formData: FormData) => Promise<void>;

type SerializableContact = Omit<ContactRecord, 'birthday' | 'lastContacted' | 'createdAt' | 'updatedAt'> & {
  birthday: string | null;
  lastContacted: string | null;
  createdAt: string;
  updatedAt: string;
};

interface ContactsClientProps {
  contacts: SerializableContact[];
  createContact: ContactAction;
  updateContact: ContactAction;
  deleteContact: ContactAction;
  markContacted: ContactAction;
  defaultRemindAfterDays: number;
}

function formatDateLabel(value: string | Date | null | undefined) {
  if (!value) {
    return 'Unknown';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ContactDeleteButton({ contact, onDelete }: { contact: SerializableContact; onDelete: ContactAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, startTransition] = useTransition();

  const handleConfirm = () => {
    setIsOpen(false);
    const formData = new FormData();
    formData.set('id', String(contact.id));

    startTransition(async () => {
      try {
        await onDelete(formData);
        toast.success(`✅ Deleted ${contact.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete contact';
        toast.error(`❌ ${message}`);
      }
    });
  };

  return (
    <>
      <Button type="button" variant="ghost" className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Delete contact?"
        message={`Deleting ${contact.name} will permanently remove this contact.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete contact'}
        variant="danger"
      />
    </>
  );
}

function ContactFields({
  prefix,
  contact,
  onCancel,
  submitLabel,
  defaultRemindAfterDays
}: {
  prefix: string;
  contact?: SerializableContact;
  onCancel?: () => void;
  submitLabel: string;
  defaultRemindAfterDays: number;
}) {
  const importantDatesValue = contact ? JSON.stringify(normalizeImportantDates(contact.importantDates), null, 2) : '';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label htmlFor={`${prefix}-name`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
        <input id={`${prefix}-name`} name="name" required defaultValue={contact?.name ?? ''} placeholder="e.g., Ada Lovelace" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      </div>

      <div>
        <label htmlFor={`${prefix}-relationship`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Relationship</label>
        <input id={`${prefix}-relationship`} name="relationship" defaultValue={contact?.relationship ?? ''} placeholder="Family, Friend, Colleague" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      </div>

      <div>
        <label htmlFor={`${prefix}-birthday`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Birthday</label>
        <input id={`${prefix}-birthday`} name="birthday" type="date" defaultValue={contact?.birthday ? contact.birthday.slice(0, 10) : ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      </div>

      <div>
        <label htmlFor={`${prefix}-phone`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Phone</label>
        <input id={`${prefix}-phone`} name="phone" defaultValue={contact?.phone ?? ''} placeholder="Optional phone number" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      </div>

      <div>
        <label htmlFor={`${prefix}-email`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <input id={`${prefix}-email`} name="email" type="email" defaultValue={contact?.email ?? ''} placeholder="Optional email address" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      </div>

      <div>
        <label htmlFor={`${prefix}-remindAfterDays`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Remind after (days)</label>
        <input id={`${prefix}-remindAfterDays`} name="remindAfterDays" type="number" min="1" step="1" defaultValue={contact?.remindAfterDays ?? defaultRemindAfterDays} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      </div>

      <div className="md:col-span-2">
        <label htmlFor={`${prefix}-importantDates`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Important dates JSON</label>
        <textarea id={`${prefix}-importantDates`} name="importantDates" rows={4} defaultValue={importantDatesValue} placeholder='[{"label":"Anniversary","date":"2026-06-14"}]' className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional JSON array of label/date pairs.</p>
      </div>

      <div className="md:col-span-2">
        <label htmlFor={`${prefix}-notes`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Notes</label>
        <textarea id={`${prefix}-notes`} name="notes" rows={4} defaultValue={contact?.notes ?? ''} placeholder="Add context, reminders, or conversation notes" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" variant="primary">{submitLabel}</Button>
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  onUpdate,
  onDelete,
  onMarkContacted,
  defaultRemindAfterDays,
  isEditing,
  onEdit,
  onCancelEdit
}: {
  contact: SerializableContact;
  onUpdate: ContactAction;
  onDelete: ContactAction;
  onMarkContacted: ContactAction;
  defaultRemindAfterDays: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const now = new Date();
  const birthdayInfo = getNextBirthdayInfo(contact.birthday, now);
  const attentionAge = getContactAttentionAge(contact, now);
  const daysSinceLastContact = getDaysSince(contact.lastContacted, now);
  const importantDates = normalizeImportantDates(contact.importantDates);
  const overdue = attentionAge !== null && attentionAge > contact.remindAfterDays;

  return (
    <Card id={`contact-${contact.id}`} className="p-0">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h3>
              {contact.relationship ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">{contact.relationship}</span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">Unassigned</span>
              )}
              {overdue ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Attention needed
                </span>
              ) : null}
            </div>

            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Birthday: {birthdayInfo ? formatDateLabel(birthdayInfo.nextBirthday) : 'Not set'}
                {birthdayInfo ? ` • ${birthdayInfo.daysUntil === 0 ? 'Today' : `${birthdayInfo.daysUntil} day${birthdayInfo.daysUntil === 1 ? '' : 's'} away`}` : ''}
              </p>
              <p>
                Last contacted: {contact.lastContacted ? `${formatDateLabel(contact.lastContacted)}${daysSinceLastContact !== null ? ` • ${daysSinceLastContact} day${daysSinceLastContact === 1 ? '' : 's'} ago` : ''}` : 'Never contacted'}
              </p>
              <p>Remind after: {contact.remindAfterDays} day{contact.remindAfterDays === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <FormSubmitWrapper action={onMarkContacted} successMessage={`Marked ${contact.name} as contacted`} errorMessage="Failed to update contact">
              <input type="hidden" name="id" value={contact.id} />
              <Button type="submit" variant="secondary" className="text-xs">Mark as Contacted</Button>
            </FormSubmitWrapper>
            <Button type="button" variant="ghost" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" onClick={isEditing ? onCancelEdit : onEdit}>
              <span className="inline-flex items-center gap-1.5">
                <PencilLine className="h-4 w-4" />
                {isEditing ? 'Close' : 'Edit'}
              </span>
            </Button>
            <ContactDeleteButton contact={contact} onDelete={onDelete} />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
            {contact.phone ? <p>Phone: {contact.phone}</p> : <p className="text-gray-400 dark:text-gray-500">Phone not set</p>}
            {contact.email ? <p>Email: {contact.email}</p> : <p className="text-gray-400 dark:text-gray-500">Email not set</p>}
          </div>

          {importantDates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Important dates</p>
              <div className="flex flex-wrap gap-2">
                {importantDates.map((item) => (
                  <span key={`${contact.id}-${item.label}-${item.date}`} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {item.label} • {formatDateLabel(item.date)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Notes preview</p>
            <p className="mt-1 whitespace-pre-wrap">{contact.notes ? contact.notes.slice(0, 180) : 'No notes yet.'}</p>
          </div>

          {isEditing ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Edit contact</h4>
              <FormSubmitWrapper action={onUpdate} successMessage={`Updated ${contact.name}`} errorMessage="Failed to update contact" onSuccess={onCancelEdit}>
                <input type="hidden" name="id" value={contact.id} />
                <div className="mt-4">
                  <ContactFields prefix={`edit-${contact.id}`} contact={contact} onCancel={onCancelEdit} submitLabel="Save changes" defaultRemindAfterDays={defaultRemindAfterDays} />
                </div>
              </FormSubmitWrapper>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default function ContactsClient({ contacts, createContact, updateContact, deleteContact, markContacted, defaultRemindAfterDays }: ContactsClientProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const normalizedQuery = search.trim().toLowerCase();
  const visibleContacts = normalizedQuery
    ? contacts.filter((contact) => {
        const relationship = contact.relationship?.toLowerCase() ?? '';
        return contact.name.toLowerCase().includes(normalizedQuery) || relationship.includes(normalizedQuery);
      })
    : contacts;

  return (
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">LifeOS</p>
          <h2 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">Contacts</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Keep friends, family, and colleagues organized with birthdays, notes, and follow-ups.</p>
        </div>

        <Button type="button" variant="primary" className="inline-flex items-center justify-center gap-2" onClick={() => setShowAddForm((value) => !value)}>
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Close' : 'Add Contact'}
        </Button>
      </div>

      <div className="flex justify-end">
        <Button href="/contacts/reminders" variant="secondary" className="inline-flex items-center justify-center">View Reminders</Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <label htmlFor="contact-search" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Search contacts</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="contact-search"
              name="contact-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or relationship"
              className="w-full rounded border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus-visible:ring-offset-gray-900"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{visibleContacts.length} contact{visibleContacts.length === 1 ? '' : 's'} shown</p>
        </div>
      </Card>

      {showAddForm ? (
        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add contact</h3>
            <FormSubmitWrapper action={createContact} successMessage="Contact created successfully" errorMessage="Failed to create contact" onSuccess={() => setShowAddForm(false)}>
              <div className="mt-4">
                <ContactFields prefix="add-contact" submitLabel="Create contact" onCancel={() => setShowAddForm(false)} defaultRemindAfterDays={defaultRemindAfterDays} />
              </div>
            </FormSubmitWrapper>
          </div>
        </Card>
      ) : null}

      {contacts.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No contacts yet"
          description="Add your first contact to get started!"
        />
      ) : visibleContacts.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No matches found"
          description="Try a different name or relationship filter."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onUpdate={updateContact}
              onDelete={deleteContact}
              onMarkContacted={markContacted}
              defaultRemindAfterDays={defaultRemindAfterDays}
              isEditing={editingId === contact.id}
              onEdit={() => setEditingId(contact.id)}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
