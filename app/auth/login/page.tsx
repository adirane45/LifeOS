'use client';

import React from 'react';
import { login } from '../serverActions';
import Button from '../../../components/ui/Button';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <div className="text-center mb-6">
          <div className="text-4xl">🔐</div>
          <h1 className="text-2xl font-bold mt-2">LifeOS</h1>
          <p className="text-sm text-gray-600 mt-1">Enter your passkey to continue</p>
        </div>

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">Passkey</label>
            <input id="password" name="password" type="password" required placeholder="Passkey" className="w-full px-4 py-2 border rounded focus:outline-none focus:ring" />
          </div>

          <div>
            <Button type="submit" variant="primary" className="w-full">Sign in</Button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">No registration required — single-user passkey.</p>
      </div>
    </div>
  );
}
