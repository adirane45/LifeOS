import { prisma } from '../../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Wallet } from 'lucide-react';
import EmptyState from '../../../components/EmptyState';
import ConfirmDeleteForm from '../../../components/ConfirmDeleteForm';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({ orderBy: { id: 'asc' } });

  async function createAccount(formData: FormData) {
    'use server';
    const name = String(formData.get('name') ?? '');
    const type = String(formData.get('type') ?? 'CHECKING') as any;
    const currency = String(formData.get('currency') ?? 'USD');
    const initial = parseFloat(String(formData.get('initial') ?? '0')) || 0;

    await prisma.account.create({ data: { name, type, currency, balance: initial, userId: 1 } });
    revalidatePath('/money');
    revalidatePath('/money/accounts');
    revalidatePath('/money/transactions');
  }

  async function deleteAccount(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: id } });
      await tx.account.delete({ where: { id } });
    });
    revalidatePath('/money');
    revalidatePath('/money/accounts');
    revalidatePath('/money/transactions');
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Manage Accounts</h2>
        <p className="text-sm text-gray-500">Create, edit, and remove accounts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium">Add account</h3>
          <form id="add-account" action={createAccount} className="mt-4 space-y-3">
            <div>
              <label className="text-sm">Name</label>
              <input name="name" className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm">Type</label>
              <select name="type" className="mt-1 w-full rounded border px-3 py-2">
                <option>CHECKING</option>
                <option>SAVINGS</option>
                <option>CREDIT</option>
                <option>INVESTMENT</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Currency</label>
              <input name="currency" defaultValue="USD" className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm">Initial balance</label>
              <input name="initial" type="number" step="0.01" defaultValue="0" className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Create</button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium">Existing accounts</h3>
          <div className="mt-4">
            {accounts.length === 0 ? (
              <EmptyState icon={<Wallet />} title="No accounts yet" description="Start by creating your first account." actionLabel="Add account" actionHref="#add-account" />
            ) : (
              <ul className="space-y-3">
                {accounts.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
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
      </div>
    </section>
  );
}
