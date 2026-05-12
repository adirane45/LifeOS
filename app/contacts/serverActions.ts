'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../lib/prisma';
import { getUser } from '../../lib/data';

async function getAuthorizedContact(contactId: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      userId: user.id
    }
  });

  if (!contact) {
    throw new Error('Contact not found');
  }

  return contact;
}

export async function markContacted(contactId: number) {
  try {
    const parsedId = Math.floor(Number(contactId));
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new Error('Invalid contact ID');
    }

    const contact = await getAuthorizedContact(parsedId);

    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastContacted: new Date() }
    });

    revalidatePath('/');
    revalidatePath('/contacts');
    revalidatePath('/contacts/reminders');
  } catch (error) {
    console.error('markContacted failed:', error);
    throw error;
  }
}

export async function snoozeReminder(contactId: number, extraDays: number) {
  try {
    const parsedId = Math.floor(Number(contactId));
    const parsedDays = Math.floor(Number(extraDays));

    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new Error('Invalid contact ID');
    }

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      throw new Error('Snooze days must be greater than 0');
    }

    const contact = await getAuthorizedContact(parsedId);

    await prisma.contact.update({
      where: { id: contact.id },
      data: { remindAfterDays: contact.remindAfterDays + parsedDays }
    });

    revalidatePath('/');
    revalidatePath('/contacts');
    revalidatePath('/contacts/reminders');
  } catch (error) {
    console.error('snoozeReminder failed:', error);
    throw error;
  }
}