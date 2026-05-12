import { prisma } from '../../../lib/prisma';
import { getContacts, getUser } from '../../../lib/data';
import { getContactOverdueDays } from '../../../lib/contactHelpers';
import ContactRemindersClient from '../../../components/contacts/ContactRemindersClient';
import { markContacted as markContactedAction, snoozeReminder as snoozeReminderAction } from '../serverActions';

export const revalidate = 60;

type ReminderContact = {
  id: number;
  name: string;
  relationship: string | null;
  lastContacted: string | null;
  remindAfterDays: number;
  overdueDays: number;
  neverContacted: boolean;
};

export default async function ContactRemindersPage() {
  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Me', email: 'me@lifeos.local' },
      select: { id: true, name: true, email: true, preferences: true }
    });
  }

  const now = new Date();
  const contacts = await getContacts(user.id).catch(() => []);

  const reminderContacts: ReminderContact[] = (contacts
    .map((contact: any): ReminderContact | null => {
      const overdueDays = getContactOverdueDays(contact, now);
      const neverContacted = !contact.lastContacted;
      const isOverdue = (overdueDays ?? 0) > 0;

      if (!neverContacted && !isOverdue) {
        return null;
      }

      return {
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship ?? null,
        lastContacted: contact.lastContacted ? contact.lastContacted.toISOString() : null,
        remindAfterDays: contact.remindAfterDays ?? 30,
        overdueDays: overdueDays ?? 0,
        neverContacted
      };
    })
    .filter(Boolean) as ReminderContact[])
    .sort((a, b) => {
      const left = a.overdueDays;
      const right = b.overdueDays;
      if (left !== right) {
        return right - left;
      }

      if (a.neverContacted !== b.neverContacted) {
        return a.neverContacted ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

  async function markContacted(formData: FormData) {
    'use server';

    const id = Number(formData.get('id'));
    if (!id || id <= 0) {
      throw new Error('Invalid contact ID');
    }

    await markContactedAction(id);
  }

  async function snoozeReminder(formData: FormData) {
    'use server';

    const id = Number(formData.get('id'));
    const days = Number(formData.get('days') ?? '3');

    if (!id || id <= 0) {
      throw new Error('Invalid contact ID');
    }

    if (!Number.isFinite(days) || days <= 0) {
      throw new Error('Snooze days must be greater than 0');
    }

    await snoozeReminderAction(id, Math.floor(days));
  }

  return (
    <ContactRemindersClient
      contacts={reminderContacts}
      markContacted={markContacted}
      snoozeReminder={snoozeReminder}
    />
  );
}