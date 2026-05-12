'use server';

import { prisma } from '../../lib/prisma';

type AssistantMessageRecord = {
  id: number;
  role: string;
  content: string;
  createdAt: Date;
};

const assistantUserId = 1;

async function ensureAssistantUser() {
  return prisma.user.upsert({
    where: { id: assistantUserId },
    update: {},
    create: {
      id: assistantUserId,
      name: 'Me',
      email: 'me@lifeos.local',
    },
  });
}

export async function saveMessage(role: string, content: string) {
  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return null;
  }

  const normalizedRole = role === 'assistant' ? 'assistant' : 'user';
  await ensureAssistantUser();

  return prisma.assistantMessage.create({
    data: {
      userId: assistantUserId,
      role: normalizedRole,
      content: normalizedContent,
    },
  });
}

export async function getMessages(): Promise<AssistantMessageRecord[]> {
  return prisma.assistantMessage.findMany({
    where: { userId: assistantUserId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });
}

export async function clearHistory() {
  return prisma.assistantMessage.deleteMany({
    where: { userId: assistantUserId },
  });
}