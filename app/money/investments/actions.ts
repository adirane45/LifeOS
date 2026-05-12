'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../../lib/prisma';
import { getUser } from '../../../lib/data';

export async function createInvestment(data: {
  name: string;
  symbol: string;
  type: string;
  quantity: number;
  buyPrice: number;
  currency?: string;
  notes?: string;
}) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!data.name?.trim()) throw new Error('Investment name is required');
    if (!data.symbol?.trim()) throw new Error('Symbol is required');
    if (!data.type) throw new Error('Investment type is required');
    if (data.quantity <= 0) throw new Error('Quantity must be greater than 0');
    if (data.buyPrice <= 0) throw new Error('Buy price must be greater than 0');

    const investment = await prisma.investment.create({
      data: {
        userId: user.id,
        name: data.name,
        symbol: data.symbol,
        type: data.type,
        quantity: data.quantity,
        buyPrice: data.buyPrice,
        currency: data.currency || 'USD',
        notes: data.notes,
        transactions: {
          create: {
            type: 'BUY',
            quantity: data.quantity,
            price: data.buyPrice,
            date: new Date(),
            notes: 'Initial purchase'
          }
        }
      },
      include: {
        transactions: true
      }
    });

    revalidatePath('/money/investments');
    return investment;
  } catch (error) {
    console.error('createInvestment failed:', error);
    throw error;
  }
}

export async function updateInvestment(
  id: number,
  data: {
    name?: string;
    quantity?: number;
    buyPrice?: number;
    notes?: string;
  }
) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!id || id <= 0) throw new Error('Invalid investment ID');
    if (data.quantity !== undefined && data.quantity <= 0) throw new Error('Quantity must be greater than 0');
    if (data.buyPrice !== undefined && data.buyPrice <= 0) throw new Error('Buy price must be greater than 0');

    // Verify ownership
    const investment = await prisma.investment.findUnique({ where: { id } });
    if (!investment || investment.userId !== user.id) {
      throw new Error('Not authorized to update this investment');
    }

    const updated = await prisma.investment.update({
      where: { id },
      data,
      include: {
        transactions: true
      }
    });

    revalidatePath('/money/investments');
    return updated;
  } catch (error) {
    console.error('updateInvestment failed:', error);
    throw error;
  }
}

export async function deleteInvestment(id: number) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!id || id <= 0) throw new Error('Invalid investment ID');

    // Verify ownership
    const investment = await prisma.investment.findUnique({ where: { id } });
    if (!investment || investment.userId !== user.id) {
      throw new Error('Not authorized to delete this investment');
    }

    await prisma.investment.delete({ where: { id } });

    revalidatePath('/money/investments');
  } catch (error) {
    console.error('deleteInvestment failed:', error);
    throw error;
  }
}

export async function addInvestmentTransaction(
  investmentId: number,
  data: {
    type: 'BUY' | 'SELL' | 'DIVIDEND';
    quantity: number;
    price: number;
    date: Date;
    notes?: string;
  }
) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!investmentId || investmentId <= 0) throw new Error('Invalid investment ID');
    if (!['BUY', 'SELL', 'DIVIDEND'].includes(data.type)) throw new Error('Invalid transaction type');
    if (data.quantity <= 0) throw new Error('Quantity must be greater than 0');
    if (data.price <= 0) throw new Error('Price must be greater than 0');
    if (isNaN(data.date.getTime())) throw new Error('Invalid date');

    // Verify ownership
    const investment = await prisma.investment.findUnique({ where: { id: investmentId } });
    if (!investment || investment.userId !== user.id) {
      throw new Error('Not authorized');
    }

    const transaction = await prisma.investmentTransaction.create({
      data: {
        investmentId,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        date: data.date,
        notes: data.notes
      }
    });

    // Update investment quantity if it's a buy or sell
    if (data.type === 'BUY') {
      await prisma.investment.update({
        where: { id: investmentId },
        data: {
          quantity: { increment: data.quantity },
          buyPrice: investment.buyPrice // Keep existing buy price (or calculate average)
        }
      });
    } else if (data.type === 'SELL') {
      await prisma.investment.update({
        where: { id: investmentId },
        data: {
          quantity: { decrement: data.quantity }
        }
      });
    }

    revalidatePath('/money/investments');
    return transaction;
  } catch (error) {
    console.error('addInvestmentTransaction failed:', error);
    throw error;
  }
}

export async function logDividend(
  investmentId: number,
  data: {
    quantity: number;
    price: number;
    date: Date;
    notes?: string;
  }
) {
  return addInvestmentTransaction(investmentId, {
    type: 'DIVIDEND',
    quantity: data.quantity,
    price: data.price,
    date: data.date,
    notes: data.notes
  });
}
