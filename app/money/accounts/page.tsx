import { prisma } from '../../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Wallet } from 'lucide-react';
import EmptyState from '../../../components/EmptyState';
import ConfirmDeleteForm from '../../../components/ConfirmDeleteForm';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getAccounts, getUser } from '../../../lib/data';
import { SUPPORTED_CURRENCIES } from '../../../lib/currency';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({ data: { name: 'Me', email: 'me@lifeos.local' }, select: { id: true, name: true, email: true, preferences: true } });
  }

  const accounts = await getAccounts(user.id);
  
  // Get user's base currency preference
  const preferences = (user.preferences as any) || {};
  const baseCurrency = preferences.baseCurrency || 'USD';

  async function createAccount(formData: FormData) {
    'use server';
    try {
      const name = String(formData.get('name') ?? '').trim();
      const type = String(formData.get('type') ?? 'CHECKING') as any;
      const currency = String(formData.get('currency') ?? baseCurrency);
      const initial = parseFloat(String(formData.get('initial') ?? '0')) || 0;

      // Validation
      if (!name) throw new Error('Account name is required');
      if (initial < 0) throw new Error('Initial balance cannot be negative');

      await prisma.account.create({ data: { name, type, currency, balance: initial, userId: user.id } });
      
      revalidatePath('/money');
      revalidatePath('/money/accounts');
      revalidatePath('/money/transactions');
    } catch (error) {
      console.error('createAccount failed:', error);
      throw error;
    }
  }

  async function deleteAccount(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id'));
      if (!id || id <= 0) throw new Error('Invalid account ID');

      await prisma.$transaction(async (tx: any) => {
        await tx.transaction.deleteMany({ where: { accountId: id } });
        await tx.account.delete({ where: { id } });
      });

      revalidatePath('/money');
      revalidatePath('/money/accounts');
      revalidatePath('/money/transactions');
    } catch (error) {
      console.error('deleteAccount failed:', error);
      throw error;
    }
  }

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold">Manage Accounts</h2>
        <p className="text-sm text-gray-500">Create, edit, and remove accounts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Add account</h3>
            <form id="add-account" action={createAccount} className="mt-4 space-y-3">
            <div>
              <label htmlFor="account-name" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Name</label>
              <input id="account-name" name="name" placeholder="e.g., Checking Account" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
            </div>
            <div>
              <label htmlFor="account-type" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Type</label>
              <select id="account-type" name="type" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">
                <option>CHECKING</option>
                <option>SAVINGS</option>
                <option>CREDIT</option>
                <option>INVESTMENT</option>
              </select>
            </div>
            <div>
              <label htmlFor="account-currency" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Currency</label>
              <select id="account-currency" name="currency" defaultValue={baseCurrency} className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="account-initial" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Initial balance</label>
              <input id="account-initial" name="initial" type="number" step="0.01" defaultValue="0" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
            </div>
            <div>
              <Button type="submit" variant="primary">Create</Button>
            </div>
          </form>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Existing accounts</h3>
            <div className="mt-4">
              {accounts.length === 0 ? (
                <EmptyState icon={<Wallet />} title="No accounts yet" description="Start by creating your first account." actionLabel="Add account" actionHref="#add-account" />
              ) : (
                <ul className="space-y-3">
                  {accounts.map((a: any) => (
                    <li key={a.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                      <div>
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.type} • {a.currency}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConfirmDeleteForm
                          action={deleteAccount}
                          itemId={a.id}
                          title="Delete account?"
                          message={`Deleting ${a.name} will also delete all of its transactions. This cannot be undone.`}
                          confirmLabel="Delete account"
                          triggerLabel="Delete"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
