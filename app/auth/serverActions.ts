'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function login(passwordOrForm: string | FormData) {
  let password: string;
  if (typeof passwordOrForm === 'string') {
    password = passwordOrForm;
  } else {
    password = (passwordOrForm.get('password') as string) || '';
  }

  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) {
    throw new Error('ACCESS_PASSWORD is not configured');
  }

  if (password !== expected) {
    return { error: 'Wrong password' };
  }

  // Generate a simple session token (no DB); presence of cookie implies authenticated
  const token =
    typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2);

  const isProd = process.env.NODE_ENV === 'production';

  const cookieStore = await cookies();
  cookieStore.set({
    name: 'lifeos_session',
    value: token,
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: isProd,
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });

  revalidatePath('/');
  redirect('/');
}

export async function logout() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'lifeos_session',
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: isProd,
    maxAge: 0,
    expires: new Date(0)
  });

  revalidatePath('/');
  redirect('/auth/login');
}
