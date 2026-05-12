'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../lib/prisma';
import { getUser } from '../../../lib/data';

export async function fetchSplitGroups() {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    const groups = await prisma.splitGroup.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        shares: {
          orderBy: { id: 'asc' }
        }
      }
    });

    return groups;
  } catch (error) {
    console.error('fetchSplitGroups failed:', error);
    throw error;
  }
}

export async function createSplitGroup(data: {
  name: string;
  totalAmount: number;
  shares: Array<{ personName: string; amount: number }>;
}) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!data.name?.trim()) throw new Error('Group name is required');
    if (data.totalAmount <= 0) throw new Error('Total amount must be greater than 0');
    if (!data.shares || data.shares.length === 0) throw new Error('At least one share is required');
    
    for (const share of data.shares) {
      if (!share.personName?.trim()) throw new Error('Person name is required for all shares');
      if (share.amount <= 0) throw new Error('Share amount must be greater than 0');
    }

    const group = await prisma.splitGroup.create({
      data: {
        userId: user.id,
        name: data.name,
        totalAmount: data.totalAmount,
        shares: {
          create: data.shares,
        },
      },
      include: {
        shares: true,
      },
    });

    revalidatePath('/money/splits');
    revalidatePath('/money');
    return group;
  } catch (error) {
    console.error('createSplitGroup failed:', error);
    throw error;
  }
}

export async function markSplitShareAsSettled(shareId: number) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!shareId || shareId <= 0) throw new Error('Invalid share ID');

    const share = await prisma.splitShare.findUnique({
      where: { id: shareId },
      include: { group: true },
    });

    if (!share || share.group.userId !== user.id) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.splitShare.update({
      where: { id: shareId },
      data: { settled: true },
    });

    revalidatePath('/money/splits');
    return updated;
  } catch (error) {
    console.error('markSplitShareAsSettled failed:', error);
    throw error;
  }
}

export async function deleteSplitGroup(groupId: number) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!groupId || groupId <= 0) throw new Error('Invalid group ID');

    const group = await prisma.splitGroup.findUnique({
      where: { id: groupId },
    });

    if (!group || group.userId !== user.id) {
      throw new Error('Unauthorized');
    }

    await prisma.splitGroup.delete({
      where: { id: groupId },
    });

    revalidatePath('/money/splits');
    revalidatePath('/money');
  } catch (error) {
    console.error('deleteSplitGroup failed:', error);
    throw error;
  }
}
