import { prisma } from '../../../lib/prisma';
import { createTransactionAndUpdateBalance, deleteTransactionAndRevertBalance } from '../../../lib/accountHelpers';
import { revalidatePath } from 'next/cache';
import { Wallet, PlusCircle } from 'lucide-react';
import EmptyState from '../../../components/EmptyState';
import ConfirmDeleteForm from '../../../components/ConfirmDeleteForm';
import { processRecurringTransactions } from '../../../lib/recurring';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getAccounts, getTransactions, getUser } from '../../../lib/data';

export const revalidate = 60;

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ account?: string; category?: string }> }) {
  const params = await searchParams;

  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({ data: { name: 'Me', email: 'me@lifeos.local' }, select: { id: true, name: true, email: true } });
  }

  const accounts = await getAccounts(user.id);

  const filters: any = {};
  if (params?.account) filters.accountId = Number(params.account);
  if (params?.category) filters.category = params.category;

  const scopeKey = `${filters.type ?? ''}|${filters.category ?? ''}|${''}|${''}|${filters.accountId ?? ''}|1`;
  const transactions = await getTransactions(user.id, 100, 'desc', scopeKey);

  async function createTransaction(formData: FormData) {
    'use server';
    const accountId = Number(formData.get('accountId'));
    const type = String(formData.get('type')) as 'INCOME' | 'EXPENSE';
    const amount = parseFloat(String(formData.get('amount')) || '0');
    const category = String(formData.get('category') || '');
    const description = String(formData.get('description') || '');
    const date = new Date(String(formData.get('date') || new Date().toISOString()));
    const isRecurring = Boolean(formData.get('isRecurring'));
    const recurrenceRule = String(formData.get('recurrenceRule') || '') || null;
    const recurrenceEndDateValue = String(formData.get('recurrenceEndDate') || '');
    const recurrenceEndDate = recurrenceEndDateValue ? new Date(recurrenceEndDateValue) : null;

    await createTransactionAndUpdateBalance({ accountId, amount, category, description, date, type, isRecurring, recurrenceRule, recurrenceEndDate });
    revalidatePath('/money');
    revalidatePath('/money/transactions');
  }

  async function runRecurring(formData: FormData) {
    'use server';
    // allow only when CRON_SECRET is set or in dev
    if (!process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('Not allowed');
    }
    await processRecurringTransactions();
    revalidatePath('/money');
    revalidatePath('/money/transactions');
  }

  async function deleteTransaction(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    await deleteTransactionAndRevertBalance(id);
    revalidatePath('/money');
    revalidatePath('/money/transactions');
  }

  return (
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-sm text-gray-500">Add and manage your transactions.</p>
        </div>
        <Button href="/api/export/transactions" download variant="secondary" className="inline-flex items-center justify-center">Export CSV</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Add transaction</h3>
            {accounts.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<Wallet />}
                  title="No accounts available"
                  description="Create an account before logging transactions."
                  actionLabel="Add account"
                  actionHref="/money/accounts#add-account"
                />
              </div>
            ) : (
              <form id="add-transaction" action={createTransaction} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm">Account</label>
                  <select name="accountId" className="mt-1 w-full rounded border px-3 py-2">
                    {accounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name} • {a.currency}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Type</label>
                  <select name="type" className="mt-1 w-full rounded border px-3 py-2">
                    <option>INCOME</option>
                    <option>EXPENSE</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Amount</label>
                  <input name="amount" type="number" step="0.01" className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm">Category</label>
                  <input name="category" className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm">Description</label>
                  <input name="description" className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm">Date</label>
                  <input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0,16)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="isRecurring" className="form-checkbox" />
                    <span className="text-sm">Recurring</span>
                  </label>
                </div>
                <div>
                  <label className="text-sm">Frequency</label>
                  <select name="recurrenceRule" className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">--</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">End date (optional)</label>
                  <input name="recurrenceEndDate" type="date" className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <Button type="submit" variant="primary">Add</Button>
                </div>
              </form>
            )}
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">All transactions</h3>
            <div className="mt-4">
              {(process.env.CRON_SECRET || process.env.NODE_ENV !== 'production') && (
                <form action={runRecurring} className="mb-4">
                  <Button type="submit" variant="secondary" size="sm">Run recurring items</Button>
                </form>
              )}
            {transactions.length === 0 ? (
              <EmptyState
                icon={<PlusCircle />}
                title="No transactions recorded"
                description="Add your first income or expense to see it listed here."
                actionLabel="Add transaction"
                actionHref="#add-transaction"
              />
            ) : (
              <ul className="space-y-3">
                {transactions.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">{t.category}</div>
                        {t.isRecurring && !t.parentTransactionId ? <div className="text-xs text-gray-500">🔄 Recurring</div> : null}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(t.date).toLocaleString()} • {t.account?.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-sm font-semibold ${t.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>{(t.type === 'EXPENSE' ? '-' : '+')}{t.amount.toFixed(2)}</div>
                      <ConfirmDeleteForm
                        action={deleteTransaction}
                        itemId={t.id}
                        title="Delete transaction?"
                        message="Deleting this transaction will permanently remove it and adjust the account balance. This cannot be undone."
                        confirmLabel="Delete transaction"
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
