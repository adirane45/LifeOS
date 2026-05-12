import { revalidatePath } from 'next/cache';
import { prisma } from '../../lib/prisma';
import { getContacts, getUser } from '../../lib/data';
import ContactsClient from '../../components/contacts/ContactsClient';
import { normalizeImportantDates } from '../../lib/contactHelpers';
import { getDefaultRemindAfterDays } from '../../lib/settingsActions';
import { markContacted as markContactedAction } from './serverActions';

export const dynamic = 'force-dynamic';

function parseDateInput(value: FormDataEntryValue | null, fieldName: string) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  const date = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName.toLowerCase()}`);
  }

  return date;
}

function parseRemindAfterDays(value: FormDataEntryValue | null, fallbackDays: number) {
  const parsed = Number(String(value ?? String(fallbackDays)).trim() || String(fallbackDays));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Remind after days must be greater than 0');
  }

  return Math.floor(parsed);
}

function parseContactFields(formData: FormData, defaultRemindAfterDays: number) {
  const name = String(formData.get('name') ?? '').trim();
  const relationship = String(formData.get('relationship') ?? '').trim();
  const birthday = parseDateInput(formData.get('birthday'), 'Birthday');
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const remindAfterDays = parseRemindAfterDays(formData.get('remindAfterDays'), defaultRemindAfterDays);
  const importantDatesRaw = String(formData.get('importantDates') ?? '').trim();
  const importantDates = normalizeImportantDates(importantDatesRaw);

  if (!name) {
    throw new Error('Name is required');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email address is invalid');
  }

  if (importantDatesRaw && importantDates.length === 0) {
    throw new Error('Important dates must be valid JSON');
  }

  return {
    name,
    relationship: relationship || null,
    birthday,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
    remindAfterDays,
    importantDates: importantDates.length > 0 ? importantDates : null
  };
}

export default async function ContactsPage() {
  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Me', email: 'me@lifeos.local' },
      select: { id: true, name: true, email: true, preferences: true }
    });
  }

  const contacts = await getContacts(user.id).catch(() => []);
  const defaultRemindAfterDays = await getDefaultRemindAfterDays();

  const serializableContacts = contacts.map((contact: any) => ({
    ...contact,
    birthday: contact.birthday ? contact.birthday.toISOString() : null,
    lastContacted: contact.lastContacted ? contact.lastContacted.toISOString() : null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString()
  }));

  async function createContact(formData: FormData) {
    'use server';
    try {
      const contact = parseContactFields(formData, defaultRemindAfterDays);

      await prisma.contact.create({
        data: {
          userId: user.id,
          ...contact
        }
      });

      revalidatePath('/contacts');
      revalidatePath('/');
    } catch (error) {
      console.error('createContact failed:', error);
      throw error;
    }
  }

  async function updateContact(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id'));
      if (!id || id <= 0) {
        throw new Error('Invalid contact ID');
      }

      const contact = parseContactFields(formData, defaultRemindAfterDays);

      const updated = await prisma.contact.updateMany({
        where: {
          id,
          userId: user.id
        },
        data: {
          ...contact
        }
      });

      if (updated.count === 0) {
        throw new Error('Contact not found');
      }

      revalidatePath('/contacts');
      revalidatePath('/');
    } catch (error) {
      console.error('updateContact failed:', error);
      throw error;
    }
  }

  async function deleteContact(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id'));
      if (!id || id <= 0) {
        throw new Error('Invalid contact ID');
      }

      const deleted = await prisma.contact.deleteMany({
        where: {
          id,
          userId: user.id
        }
      });

      if (deleted.count === 0) {
        throw new Error('Contact not found');
      }

      revalidatePath('/contacts');
      revalidatePath('/');
    } catch (error) {
      console.error('deleteContact failed:', error);
      throw error;
    }
  }

  async function markContacted(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id'));
      if (!id || id <= 0) {
        throw new Error('Invalid contact ID');
      }

      await markContactedAction(id);
    } catch (error) {
      console.error('markContacted failed:', error);
      throw error;
    }
  }

  return (
    <ContactsClient
      contacts={serializableContacts}
      createContact={createContact}
      updateContact={updateContact}
      deleteContact={deleteContact}
      markContacted={markContacted}
      defaultRemindAfterDays={defaultRemindAfterDays}
    />
  );
}
