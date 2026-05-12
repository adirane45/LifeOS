import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, FileText, PiggyBank } from 'lucide-react';
import { prisma } from '../../../lib/prisma';
import { getAccounts, getBills, getTransactions, getUser } from '../../../lib/data';
import ConfirmDeleteForm from '../../../components/ConfirmDeleteForm';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/EmptyState';

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES = [
  'Rent',
  'Utilities',
  'Internet',
  'Groceries',
  'Food',
  'Transport',
  'Subscriptions',
  'Insurance',
  'Health',
  'Education',
  'Travel',
  'Entertainment',
  'Shopping',
  'Other'
];

const FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONCE'] as const;

type Frequency = (typeof FREQUENCIES)[number];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDueDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function daysUntilDue(dueDate: Date) {
  const now = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return Math.round((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function formatFrequencyLabel(frequency: string) {
  return frequency.toLowerCase();
}

export default async function BillsPage() {
  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({ data: { name: 'Me', email: 'me@lifeos.local' }, select: { id: true, name: true, email: true } });
  }

  const now = new Date();
  const [bills, accounts, transactions] = await Promise.all([
    getBills(user.id, 200, true),
    getAccounts(user.id),
    getTransactions(user.id, 500, 'desc', '|||||0')
  ]);

  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...transactions.map((transaction: any) => transaction.category).filter(Boolean)])).sort();
  const unpaidBills = bills.filter((bill: any) => !bill.isPaid);
  const overdueBills = unpaidBills.filter((bill: any) => startOfDay(new Date(bill.dueDate)).getTime() < startOfDay(now).getTime());

  async function createBill(formData: FormData) {
    'use server';

    const name = String(formData.get('name') ?? '').trim();
    const amount = Number(formData.get('amount') ?? '0');
    const category = String(formData.get('category') ?? '').trim();
    const dueDateValue = String(formData.get('dueDate') ?? '').trim();
    const frequency = String(formData.get('frequency') ?? 'MONTHLY').trim() as Frequency;
    const notes = String(formData.get('notes') ?? '').trim();

    if (!name || !amount || amount <= 0 || !category || !dueDateValue) {
      return;
    }

    await prisma.bill.create({
      data: {
        userId: user.id,
        name,
        amount,
        category,
        dueDate: new Date(`${dueDateValue}T00:00:00`),
        frequency: FREQUENCIES.includes(frequency) ? frequency : 'MONTHLY',
        notes: notes || null
      }
    });

    revalidatePath('/money/bills');
    revalidatePath('/money');
    revalidatePath('/');
  }

  async function markBillPaid(formData: FormData) {
    'use server';

    const billId = Number(formData.get('id') ?? '0');
    const accountIdValue = String(formData.get('accountId') ?? '').trim();
    const accountId = accountIdValue ? Number(accountIdValue) : null;

    if (!billId) {
      return;
    }

    const paidDate = new Date();

    await prisma.$transaction(async (tx: any) => {
      const bill = await tx.bill.findFirst({ where: { id: billId, userId: user.id } });
      if (!bill || bill.isPaid) {
        return;
      }

      if (accountId) {
        const account = await tx.account.findFirst({ where: { id: accountId, userId: user.id } });
        if (!account) {
          throw new Error('Selected account was not found');
        }

        await tx.transaction.create({
          data: {
            accountId: account.id,
            amount: Math.abs(bill.amount),
            category: bill.category,
            description: bill.name,
            date: paidDate,
            type: 'EXPENSE'
          }
        });

        await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: -Math.abs(bill.amount) } }
        });
      }

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          isPaid: true,
          paidDate
        }
      });
    });

    revalidatePath('/money/bills');
    revalidatePath('/money');
    revalidatePath('/');
  }

  async function deleteBill(formData: FormData) {
    'use server';

    const billId = Number(formData.get('id') ?? '0');
    if (!billId) {
      return;
    }

    await prisma.bill.deleteMany({ where: { id: billId, userId: user.id } });

    revalidatePath('/money/bills');
    revalidatePath('/money');
    revalidatePath('/');
  }

  return (
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Money</p>
          <h2 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">Bills</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Track recurring and one-time bills, then mark them paid when they clear.</p>
        </div>
        <div className="flex gap-2">
          <Button href="/money" variant="secondary" className="inline-flex items-center justify-center">Back to money</Button>
          <Button href="#create-bill" variant="primary" className="inline-flex items-center justify-center">New bill</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create bill</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add rent, subscriptions, utilities, or any scheduled payment.</p>
              </div>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>

            <form id="create-bill" action={createBill} className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="bill-name" className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name</label>
                <input id="bill-name" name="name" required placeholder="e.g., Electricity" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
              </div>

              <div>
                <label htmlFor="bill-amount" className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Amount</label>
                <input id="bill-amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
              </div>

              <div>
                <label htmlFor="bill-category" className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Category</label>
                <select id="bill-category" name="category" required defaultValue="" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bill-frequency" className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Frequency</label>
                <select id="bill-frequency" name="frequency" defaultValue="MONTHLY" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">
                  {FREQUENCIES.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bill-due-date" className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Due date</label>
                <input id="bill-due-date" name="dueDate" type="date" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
              </div>

              <div>
                <label htmlFor="bill-notes" className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Notes</label>
                <input id="bill-notes" name="notes" placeholder="Optional reminder note" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" variant="primary">Create bill</Button>
              </div>
            </form>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bill summary</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">A quick scan of what is due next.</p>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {unpaidBills.length} unpaid
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {unpaidBills.length === 0 ? (
                <EmptyState
                  icon={<PiggyBank />}
                  title="No bills yet"
                  description="Add your first bill to keep upcoming payments visible."
                  actionLabel="Create bill"
                  actionHref="#create-bill"
                />
              ) : (
                unpaidBills.slice(0, 4).map((bill: any) => {
                  const dueIn = daysUntilDue(bill.dueDate);
                  const overdue = dueIn < 0;
                  return (
                    <div key={bill.id} className={`rounded-2xl border p-4 ${overdue ? 'border-rose-200 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {overdue ? <AlertCircle className="h-4 w-4 text-rose-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{bill.name}</p>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Due {formatDueDate(new Date(bill.dueDate))}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(bill.amount)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-200 px-2.5 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{bill.category}</span>
                        <span className="rounded-full bg-gray-200 px-2.5 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{formatFrequencyLabel(bill.frequency)}</span>
                        <span className={`rounded-full px-2.5 py-1 ${overdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200' : dueIn === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'}`}>
                          {overdue ? `Overdue by ${Math.abs(dueIn)} day${Math.abs(dueIn) === 1 ? '' : 's'}` : dueIn === 0 ? 'Due today' : `${dueIn} day${dueIn === 1 ? '' : 's'} left`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bills.length === 0 ? null : bills.map((bill: any) => {
          const dueIn = daysUntilDue(bill.dueDate);
          const overdue = !bill.isPaid && dueIn < 0;
          const cardAccent = bill.isPaid ? 'green' : overdue ? 'red' : 'amber';
          return (
            <Card key={bill.id} accent={cardAccent as any} className={`p-0 ${overdue ? 'border-rose-300 dark:border-rose-500/40' : ''}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {overdue ? <AlertCircle className="h-4 w-4 text-rose-600" /> : bill.isPaid ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <PiggyBank className="h-4 w-4 text-amber-600" />}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{bill.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{bill.category} • {formatFrequencyLabel(bill.frequency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(bill.amount)}</p>
                    <p className={`text-xs ${bill.isPaid ? 'text-emerald-600' : overdue ? 'text-rose-600' : 'text-gray-500 dark:text-gray-400'}`}>
                      {bill.isPaid
                        ? `Paid ${bill.paidDate ? `on ${formatDueDate(new Date(bill.paidDate))}` : ''}`
                        : overdue
                          ? `Overdue by ${Math.abs(dueIn)} day${Math.abs(dueIn) === 1 ? '' : 's'}`
                          : dueIn === 0
                            ? 'Due today'
                            : `Due in ${dueIn} day${dueIn === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-gray-200 px-2.5 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{formatDueDate(new Date(bill.dueDate))}</span>
                  <span className="rounded-full bg-gray-200 px-2.5 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{bill.frequency}</span>
                  {bill.notes ? <span className="rounded-full bg-gray-200 px-2.5 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-200">Note saved</span> : null}
                </div>

                {bill.notes ? <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{bill.notes}</p> : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {bill.isPaid ? 'Already marked as paid.' : 'Mark it paid once the bill clears.'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!bill.isPaid ? (
                      <form action={markBillPaid} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={bill.id} />
                        {accounts.length > 0 ? (
                          <select name="accountId" defaultValue="" className="min-w-[180px] rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">
                            <option value="">No account</option>
                            {accounts.map((account: any) => (
                              <option key={account.id} value={account.id}>
                                {account.name} • {account.currency}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <Button type="submit" variant="secondary" size="sm" className="inline-flex items-center justify-center">
                          Mark as paid
                        </Button>
                      </form>
                    ) : null}

                    <ConfirmDeleteForm
                      action={deleteBill}
                      itemId={bill.id}
                      title="Delete bill?"
                      message={`Deleting ${bill.name} will remove the bill from reminders and history.`}
                      confirmLabel="Delete bill"
                      triggerLabel="Delete"
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
