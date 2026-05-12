import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Target, PlusCircle } from 'lucide-react';
import { prisma } from '../../lib/prisma';
import ConfirmDeleteForm from '../../components/ConfirmDeleteForm';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FormSubmitWrapper from '../../components/FormSubmitWrapper';
import { getGoals, getUser } from '../../lib/data';

export const dynamic = 'force-dynamic';

export const revalidate = 60;

function clampPercent(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function goalProgress(goal: any) {
  const target = typeof goal.targetValue === 'number' ? goal.targetValue : 0;
  const current = typeof goal.currentValue === 'number' ? goal.currentValue : 0;
  if (target <= 0) return 0;
  return clampPercent((current / target) * 100);
}

function categoryClass(category: string) {
  switch (category) {
    case 'FINANCE':
      return 'bg-emerald-100 text-emerald-700';
    case 'HABIT':
      return 'bg-sky-100 text-sky-700';
    case 'HEALTH':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default async function GoalsPage() {
  let user = await getUser();

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Me',
        email: 'me@lifeos.local'
      }
    });
  }

  async function createGoal(formData: FormData) {
    'use server';
    try {
      const title = String(formData.get('title') || '').trim();
      const description = String(formData.get('description') || '').trim();
      const category = String(formData.get('category') || 'OTHER').toUpperCase();
      const targetValueStr = String(formData.get('targetValue') || '').trim();
      const currentValueStr = String(formData.get('currentValue') || '').trim();
      const unit = String(formData.get('unit') || '').trim();
      const targetDateStr = String(formData.get('targetDate') || '').trim();

      // Validation
      if (!title) throw new Error('Goal title is required');
      if (!['FINANCE', 'HABIT', 'HEALTH', 'OTHER'].includes(category)) throw new Error('Invalid category');

      await prisma.goal.create({
        data: {
          userId: user.id,
          title,
          description: description || null,
          category,
          targetValue: targetValueStr ? Number(targetValueStr) : null,
          currentValue: currentValueStr ? Number(currentValueStr) : null,
          unit: unit || null,
          targetDate: targetDateStr ? new Date(targetDateStr) : null,
          completed: false
        }
      });

      revalidatePath('/goals');
      revalidatePath('/');
    } catch (error) {
      console.error('createGoal failed:', error);
      throw error;
    }
  }

  async function updateGoal(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id'));
      const currentValueStr = String(formData.get('currentValue') || '').trim();
      const completed = Boolean(formData.get('completed'));

      // Validation
      if (!id || id <= 0) throw new Error('Invalid goal ID');

      await prisma.goal.update({
        where: { id },
        data: {
          currentValue: currentValueStr ? Number(currentValueStr) : null,
          completed
        }
      });

      revalidatePath('/goals');
      revalidatePath('/');
    } catch (error) {
      console.error('updateGoal failed:', error);
      throw error;
    }
  }

  async function deleteGoal(formData: FormData) {
    'use server';
    try {
      const id = Number(formData.get('id'));
      if (!id || id <= 0) throw new Error('Invalid goal ID');

      await prisma.goal.delete({ where: { id } });

      revalidatePath('/goals');
      revalidatePath('/');
    } catch (error) {
      console.error('deleteGoal failed:', error);
      throw error;
    }
  }

  const goals = await getGoals(user.id, 100);

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Goals</h2>
        <p className="text-sm text-gray-600 dark:text-gray-500">Track progress across finance, habits, health, and more.</p>
      </div>

      <div id="add-goal" className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add goal</h3>
        <FormSubmitWrapper 
          action={createGoal}
          successMessage="Goal created successfully"
          errorMessage="Failed to create goal"
        >
          <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="goal-title" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Title</label>
            <input id="goal-title" name="title" required placeholder="e.g., Save $5000" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="goal-description" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Description</label>
            <input id="goal-description" name="description" placeholder="Optional description" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
          </div>

          <div>
            <label htmlFor="goal-category" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Category</label>
            <select id="goal-category" name="category" defaultValue="OTHER" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">
              <option value="FINANCE">FINANCE</option>
              <option value="HABIT">HABIT</option>
              <option value="HEALTH">HEALTH</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <label htmlFor="goal-target" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Target value</label>
            <input id="goal-target" name="targetValue" type="number" step="0.01" placeholder="100" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
          </div>

          <div>
            <label htmlFor="goal-current" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Current value</label>
            <input id="goal-current" name="currentValue" type="number" step="0.01" placeholder="0" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
          </div>

          <div>
            <label htmlFor="goal-unit" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Unit</label>
            <input id="goal-unit" name="unit" placeholder="₹ / kg / days" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
          </div>

          <div>
            <label htmlFor="goal-target-date" className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Target date (optional)</label>
            <input id="goal-target-date" name="targetDate" type="date" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" variant="primary" className="rounded">Create goal</Button>
          </div>
          </div>
        </FormSubmitWrapper>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your goals</h3>

        {goals.length === 0 ? (
          <div className="mt-4 rounded-xl bg-gray-50 p-6 text-center dark:bg-gray-900/40">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-300">
              <Target className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">No goals set yet. Create your first goal!</p>
            <Link href="#add-goal" className="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-700">Go to goal form</Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {goals.map((goal: any) => {
              const progress = goalProgress(goal);
              const unit = goal.unit ? ` ${goal.unit}` : '';
              const accent = goal.category === 'FINANCE' ? 'green' : goal.category === 'HABIT' ? 'blue' : goal.category === 'HEALTH' ? 'amber' : 'default';
              return (
                <Card key={goal.id} title={goal.title} accent={accent} className="p-0">
                  <div className="p-4">
                    {goal.description ? <p className="text-sm text-gray-600 dark:text-gray-300">{goal.description}</p> : null}

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {(goal.currentValue ?? 0).toFixed(2)}{unit} / {(goal.targetValue ?? 0).toFixed(2)}{unit}
                      </p>
                      {goal.targetDate ? (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Target date: {new Date(goal.targetDate).toLocaleDateString()}</p>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
                      <form action={updateGoal} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input type="hidden" name="id" value={goal.id} />
                        <input
                          name="currentValue"
                          type="number"
                          step="0.01"
                          defaultValue={goal.currentValue ?? ''}
                          placeholder="Current"
                          className="w-full min-w-0 rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 sm:flex-1"
                        />
                        <label className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200 sm:w-auto">
                          <input name="completed" type="checkbox" defaultChecked={goal.completed} />
                          Done
                        </label>
                        <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto">Update</Button>
                      </form>

                      <ConfirmDeleteForm
                        action={deleteGoal}
                        itemId={goal.id}
                        title="Delete goal?"
                        message="Deleting this goal will permanently remove its progress. This cannot be undone."
                        confirmLabel="Delete goal"
                        triggerLabel="Delete"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
