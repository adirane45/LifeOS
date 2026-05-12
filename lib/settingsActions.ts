'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';
import { getUser } from './data';

export async function setBaseCurrency(currency: string) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!currency?.trim()) throw new Error('Currency is required');
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK'];
    if (!validCurrencies.includes(currency.toUpperCase())) throw new Error('Invalid currency');

    const preferences = (user.preferences as any) || {};
    preferences.baseCurrency = currency;

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences }
    });

    revalidatePath('/');
    revalidatePath('/money');
    revalidatePath('/money/accounts');
    revalidatePath('/settings');
  } catch (error) {
    console.error('setBaseCurrency failed:', error);
    throw error;
  }
}

export async function getBaseCurrency() {
  try {
    const user = await getUser();
    if (!user) return 'USD';

    const preferences = (user.preferences as any) || {};
    return preferences.baseCurrency || 'USD';
  } catch (error) {
    console.error('getBaseCurrency failed:', error);
    return 'USD';
  }
}

export async function setTaxPreferences(regime: 'OLD' | 'NEW', country: string) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    // Validation
    if (!['OLD', 'NEW'].includes(regime)) throw new Error('Invalid tax regime');
    if (!country?.trim()) throw new Error('Tax country is required');

    const preferences = (user.preferences as any) || {};
    preferences.preferredTaxRegime = regime;
    preferences.taxCountry = country;

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences }
    });

    revalidatePath('/');
    revalidatePath('/money/tax');
    revalidatePath('/settings');
  } catch (error) {
    console.error('setTaxPreferences failed:', error);
    throw error;
  }
}

export async function getTaxPreferences() {
  try {
    const user = await getUser();
    if (!user) return { regime: 'NEW', country: 'India' };

    const preferences = (user.preferences as any) || {};
    return {
      regime: preferences.preferredTaxRegime || 'NEW',
      country: preferences.taxCountry || 'India'
    };
  } catch (error) {
    console.error('getTaxPreferences failed:', error);
    return { regime: 'NEW', country: 'India' };
  }
}

export async function setDefaultRemindAfterDays(days: number) {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    const parsedDays = Math.floor(Number(days));
    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      throw new Error('Default remind after days must be greater than 0');
    }

    const preferences = (user.preferences as any) || {};
    preferences.defaultRemindAfterDays = parsedDays;

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences }
    });

    revalidatePath('/settings');
    revalidatePath('/contacts');
    revalidatePath('/contacts/reminders');
  } catch (error) {
    console.error('setDefaultRemindAfterDays failed:', error);
    throw error;
  }
}

export async function getDefaultRemindAfterDays() {
  try {
    const user = await getUser();
    if (!user) return 30;

    const preferences = (user.preferences as any) || {};
    const parsed = Number(preferences.defaultRemindAfterDays ?? 30);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 30;
    }

    return Math.floor(parsed);
  } catch (error) {
    console.error('getDefaultRemindAfterDays failed:', error);
    return 30;
  }
}

export async function markOnboardingCompleted() {
  try {
    const user = await getUser();
    if (!user) throw new Error('Unauthorized');

    const preferences = (user.preferences as any) || {};
    preferences.onboardingCompleted = true;

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences }
    });

    revalidatePath('/');
  } catch (error) {
    console.error('markOnboardingCompleted failed:', error);
    throw error;
  }
}

export async function getOnboardingStatus() {
  try {
    const user = await getUser();
    if (!user) return false;

    const preferences = (user.preferences as any) || {};
    return preferences.onboardingCompleted === true;
  } catch (error) {
    console.error('getOnboardingStatus failed:', error);
    return false;
  }
}
