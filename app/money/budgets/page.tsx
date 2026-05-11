import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { PiggyBank } from 'lucide-react';
import { prisma } from '../../../lib/prisma';
import ConfirmDeleteForm from '../../../components/ConfirmDeleteForm';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getTransactions, getUser } from '../../../lib/data';

export const revalidate = 60;

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function nextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function toMonthInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function toMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default async function BudgetsPage() {
  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Me', email: 'me@lifeos.local' }
    });
  }

  const categories = Array.from(
    new Set((await getTransactions(user.id, 500, 'desc', `EXPENSE|||||0`)).map((transaction: any) => transaction.category))
  )
    .sort()
    .map((category: any) => ({ category }));

  async function createOrUpdateBudget(formData: FormData) {
    'use server';
    try {
      const category = String(formData.get('category') || '').trim();
      const amount = Number(formData.get('amount') || '0');
      const monthValue = String(formData.get('month') || '');

      if (!category || !amount || amount <= 0 || !monthValue) {
        return;
      }

      const parsedMonth = new Date(`${monthValue}-01T00:00:00`);
      const normalizedMonth = monthStart(parsedMonth);
      const rangeEnd = nextMonthStart(normalizedMonth);

      const existing = await prisma.budget.findFirst({
        where: {
          userId: user.id,
          category,
          month: {
            gte: normalizedMonth,
            lt: rangeEnd
          }
        }
      });

      if (existing) {
        await prisma.budget.update({
          where: { id: existing.id },
          data: { amount, month: normalizedMonth }
        });
      } else {
        await prisma.budget.create({
          data: { userId: user.id, category, amount, month: normalizedMonth }
        });
      }

      revalidatePath('/money/budgets');
      revalidatePath('/money');
      revalidatePath('/');
    } catch (error) {
      console.error('createOrUpdateBudget failed', error);
      throw new Error('Failed to save budget');
    }
  }

  async function updateBudget(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id') || '0');
      const amount = Number(formData.get('amount') || '0');
      if (!id || !amount || amount <= 0) return;

      await prisma.budget.update({ where: { id }, data: { amount } });

      revalidatePath('/money/budgets');
      revalidatePath('/money');
      revalidatePath('/');
    } catch (error) {
      console.error('updateBudget failed', error);
      throw new Error('Failed to update budget');
    }
  }

  async function deleteBudget(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id') || '0');
      if (!id) return;

      await prisma.budget.delete({ where: { id } });

      revalidatePath('/money/budgets');
      revalidatePath('/money');
      revalidatePath('/');
    } catch (error) {
      console.error('deleteBudget failed', error);
      throw new Error('Failed to delete budget');
    }
  }

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    orderBy: [{ month: 'desc' }, { category: 'asc' }]
  });

  const budgetRows = await Promise.all(
    budgets.map(async (budget: any) => {
      const start = monthStart(new Date(budget.month));
      const end = nextMonthStart(start);
      const spentAgg = await prisma.transaction.aggregate({
        where: {
          account: { userId: user.id },
          type: 'EXPENSE',
          category: budget.category,
          date: { gte: start, lt: end }
        },
        _sum: { amount: true }
      });

      const spent = spentAgg._sum.amount ?? 0;
      const progress = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;

      return { budget, spent, progress };
    })
  );

  const currentMonth = monthStart(new Date());

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold">Budgets</h2>
        <p className="text-sm text-gray-500">Set monthly category limits and track spending progress.</p>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Create or update budget</h3>
          <form action={createOrUpdateBudget} className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm">Category</label>
              <input name="category" list="budget-categories" required placeholder="Food" className="mt-1 w-full rounded border px-3 py-2" />
              <datalist id="budget-categories">
                {categories.map((c) => (
                  <option key={c.category} value={c.category} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-sm">Monthly amount</label>
              <input name="amount" type="number" step="0.01" required className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm">Month</label>
              <input name="month" type="month" defaultValue={toMonthInputValue(currentMonth)} required className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" variant="primary">Save budget</Button>
              <Button href="/money" variant="ghost" className="ml-3">Back to Money overview</Button>
            </div>
          </form>
        </div>
      </Card>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Existing budgets</h3>
          {budgetRows.length === 0 ? (
            <div className="mt-4 rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              <PiggyBank className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2">No budgets set yet.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {budgetRows.map(({ budget, spent, progress }) => {
                const overspent = spent > budget.amount;
                return (
                  <li key={budget.id} className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{budget.category}</p>
                        <p className="text-xs text-gray-500">{toMonthLabel(new Date(budget.month))}</p>
                      </div>
                      <p className="text-sm font-semibold">{spent.toFixed(2)} / {budget.amount.toFixed(2)}</p>
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                      <div className={`h-2 rounded-full ${overspent ? 'bg-rose-500' : progress >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <form action={updateBudget} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={budget.id} />
                        <input name="amount" type="number" step="0.01" defaultValue={budget.amount} className="w-32 rounded border px-2 py-1 text-sm" />
                        <Button type="submit" variant="secondary" size="sm">Update</Button>
                      </form>

                      <ConfirmDeleteForm
                        action={deleteBudget}
                        itemId={budget.id}
                        title="Delete budget?"
                        message="This will remove the monthly budget alert for this category."
                        confirmLabel="Delete budget"
                        triggerLabel="Delete"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </section>
  );
}
