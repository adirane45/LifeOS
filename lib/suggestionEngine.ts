import { prisma } from './prisma';
import { getTransactions, getHabits, getHealthMetrics, getBills, getContacts, getGoals } from './data';
import OpenAI from 'openai';

type Suggestion = { text: string; icon: string; action?: { label: string; url: string } };

function startOfDayUTC(d: Date) {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
}

async function callAIForSuggestions(snapshot: any, timeoutMs = 8000): Promise<Suggestion[] | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.COHERE_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are LifeOS suggestion engine. Given the following JSON snapshot of user data, return a JSON array of 2-4 suggestions. Each suggestion must have: text, icon (one-word lucide name), and optional action with label and url. Return only JSON array. Snapshot:\n${JSON.stringify(snapshot, null, 2)}`;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400
    }).finally(() => clearTimeout(timeout));

    const text = (res.choices?.[0]?.message?.content ?? '').trim();
    if (!text) return null;

    // Try to extract JSON
    const jsonStart = text.indexOf('[');
    const json = jsonStart >= 0 ? text.slice(jsonStart) : text;
    const parsed = JSON.parse(json) as any[];
    return parsed.map((p) => ({ text: String(p.text), icon: String(p.icon || 'Info'), action: p.action ? { label: String(p.action.label), url: String(p.action.url) } : undefined }));
  } catch (err) {
    return null;
  }
}

function ruleBasedSuggestions(snapshot: any): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Finances: compare total per-category current week vs previous week
  try {
    const curr = snapshot.expensesByCategoryThisWeek || {};
    const prev = snapshot.expensesByCategoryPrevWeek || {};
    const categories = Array.from(new Set([...Object.keys(curr), ...Object.keys(prev)]));
    let topDiff = 0;
    let topCat = '';
    for (const c of categories) {
      const a = curr[c] ?? 0;
      const b = prev[c] ?? 0.00001;
      const pct = ((a - b) / Math.max(1, b)) * 100;
      if (pct > topDiff) {
        topDiff = pct;
        topCat = c;
      }
    }
    if (topCat && topDiff > 15) {
      suggestions.push({ text: `You spent ${Math.round(topDiff)}% more on ${topCat} this week compared to last week. Consider adjusting your '${topCat}' budget.`, icon: 'TrendingDown', action: { label: 'Open budgets', url: '/money/budgets' } });
    }
  } catch {}

  // Habits: look for streaks
  try {
    const habits = snapshot.habits || [];
    for (const h of habits) {
      if (h.streak && h.streak >= 6) {
        suggestions.push({ text: `You've completed '${h.name}' ${h.streak} days in a row! One more for a 7-day streak.`, icon: 'Flame', action: { label: 'See habits', url: '/habits' } });
        break;
      }
    }
  } catch {}

  // Health
  try {
    const sleepAvg = snapshot.sleepAvg;
    if (typeof sleepAvg === 'number' && sleepAvg < 6.5) {
      suggestions.push({ text: `Your average sleep this week was ${sleepAvg.toFixed(1)} hours — below your 7-hour goal. Try going to bed 30 minutes earlier.`, icon: 'Moon' });
    }
  } catch {}

  // Goals
  try {
    const activeGoals = snapshot.goals || [];
    for (const g of activeGoals) {
      const progress = g.targetValue && g.currentValue ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
      if (progress >= 70 && progress < 100) {
        suggestions.push({ text: `You're ${progress}% of the way to '${g.title}' — keep going!`, icon: 'Target', action: { label: 'Open goals', url: '/goals' } });
        break;
      }
    }
  } catch {}

  // Bills
  try {
    const bills = snapshot.upcomingBills || [];
    if (bills.length > 0) {
      const b = bills[0];
      suggestions.push({ text: `${b.name} of ${b.amount} is due in ${b.daysUntil} days.`, icon: 'AlertCircle', action: { label: 'Open bills', url: '/money/bills' } });
    }
  } catch {}

  // Contacts
  try {
    const contact = snapshot.olderContacts?.[0];
    if (contact) {
      suggestions.push({ text: `You haven't contacted ${contact.name} in ${contact.days} days. Maybe give them a call?`, icon: 'Phone', action: { label: 'Open contacts', url: '/contacts' } });
    }
  } catch {}

  // Trim to 4
  return suggestions.slice(0, 4);
}

export async function generateSuggestions(userId: number): Promise<Suggestion[]> {
  const now = new Date();
  const sevenAgo = new Date(now);
  sevenAgo.setDate(now.getDate() - 7);
  const fourteenAgo = new Date(now);
  fourteenAgo.setDate(now.getDate() - 14);

  // Fetch snapshot data in parallel
  const [transactions, habits, healthMetrics, bills, contacts, goals] = await Promise.all([
    prisma.transaction.findMany({ where: { account: { userId }, type: 'EXPENSE', date: { gte: sevenAgo } } }).catch(() => []),
    prisma.habit.findMany({ where: { userId }, include: { logs: true } }).catch(() => []),
    prisma.healthMetric.findMany({ where: { userId, date: { gte: sevenAgo } }, orderBy: { date: 'desc' } }).catch(() => []),
    prisma.bill.findMany({ where: { userId, isPaid: false }, orderBy: { dueDate: 'asc' } }).catch(() => []),
    prisma.contact.findMany({ where: { userId } }).catch(() => []),
    prisma.goal.findMany({ where: { userId, completed: false } }).catch(() => [])
  ]);

  // Aggregate expenses by category this week
  const expensesByCategoryThisWeek: Record<string, number> = {};
  for (const tx of transactions) {
    const cat = tx.category || 'Other';
    expensesByCategoryThisWeek[cat] = (expensesByCategoryThisWeek[cat] ?? 0) + (tx.amount ?? 0);
  }

  // Previous week - fetch transactions for previous 7-14 days window
  const prevTx = await prisma.transaction.findMany({ where: { account: { userId }, type: 'EXPENSE', date: { gte: fourteenAgo, lt: sevenAgo } } }).catch(() => []);
  const expensesByCategoryPrevWeek: Record<string, number> = {};
  for (const tx of prevTx) {
    const cat = tx.category || 'Other';
    expensesByCategoryPrevWeek[cat] = (expensesByCategoryPrevWeek[cat] ?? 0) + (tx.amount ?? 0);
  }

  // Habit stats
  const habitStats = (habits || []).map((h: any) => {
    const recentLogs = (h.logs || []).filter((l: any) => new Date(l.date) >= sevenAgo);
    // calculate streak (simple consecutive days from most recent)
    const dates = recentLogs.map((l: any) => new Date(l.date).toDateString());
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    let streak = 0;
    let cursor = new Date();
    for (const d of uniqueDates) {
      const ds = new Date(d);
      if (startOfDayUTC(ds).getTime() === startOfDayUTC(cursor).getTime()) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
    return { id: h.id, name: h.name, streak, recentCount: recentLogs.length };
  });

  // Health aggregates
  const weightMetrics = (healthMetrics || []).filter((m: any) => m.type === 'WEIGHT');
  const sleepMetrics = (healthMetrics || []).filter((m: any) => m.type === 'SLEEP');
  const sleepAvg = sleepMetrics.length ? sleepMetrics.reduce((s: number, m: any) => s + (m.value ?? 0), 0) / sleepMetrics.length : null;

  // Contacts not contacted recently
  const olderContacts = (contacts || []).map((c: any) => ({ id: c.id, name: c.name, days: c.lastContacted ? Math.round((Date.now() - new Date(c.lastContacted).getTime()) / (24 * 60 * 60 * 1000)) : 9999 })).sort((a: any, b: any) => b.days - a.days).slice(0, 5);

  // upcoming bills days until
  const upcomingBills = (bills || []).map((b: any) => ({ id: b.id, name: b.name, amount: b.amount, dueDate: b.dueDate, daysUntil: Math.round((new Date(b.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) })).slice(0, 5);

  const snapshot = {
    expensesByCategoryThisWeek,
    expensesByCategoryPrevWeek,
    habits: habitStats,
    sleepAvg: sleepAvg ? Number((sleepAvg).toFixed(2)) : null,
    upcomingBills,
    olderContacts,
    goals: goals || []
  };

  // Try AI first
  const aiResult = await callAIForSuggestions(snapshot, 8000);
  if (Array.isArray(aiResult) && aiResult.length > 0) {
    return aiResult;
  }

  // Fallback
  return ruleBasedSuggestions({
    expensesByCategoryThisWeek,
    expensesByCategoryPrevWeek,
    habits: habitStats,
    sleepAvg,
    upcomingBills,
    olderContacts,
    goals: goals || []
  });
}

export async function getDailySuggestions(userId: number) {
  const todayStart = startOfDayUTC(new Date());
  const existing = await prisma.suggestion.findMany({ where: { userId, date: { gte: todayStart }, dismissed: false }, orderBy: { createdAt: 'asc' } });
  if (existing && existing.length > 0) return existing.map((s) => ({ id: s.id, text: s.text, icon: s.icon, action: s.actionLabel ? { label: s.actionLabel, url: s.actionUrl } : undefined }));

  const generated = await generateSuggestions(userId);
  // store
  const created = [] as any[];
  for (const g of generated) {
    const row = await prisma.suggestion.create({ data: { userId, text: g.text, icon: g.icon, actionLabel: g.action?.label, actionUrl: g.action?.url } });
    created.push(row);
  }
  return created.map((s) => ({ id: s.id, text: s.text, icon: s.icon, action: s.actionLabel ? { label: s.actionLabel, url: s.actionUrl } : undefined }));
}

export async function refreshSuggestions(userId: number) {
  const todayStart = startOfDayUTC(new Date());
  // delete today's suggestions for user
  await prisma.suggestion.deleteMany({ where: { userId, date: { gte: todayStart } } });
  const generated = await generateSuggestions(userId);
  const created = [] as any[];
  for (const g of generated) {
    const row = await prisma.suggestion.create({ data: { userId, text: g.text, icon: g.icon, actionLabel: g.action?.label, actionUrl: g.action?.url } });
    created.push(row);
  }
  return created.map((s) => ({ id: s.id, text: s.text, icon: s.icon, action: s.actionLabel ? { label: s.actionLabel, url: s.actionUrl } : undefined }));
}

export async function dismissSuggestion(suggestionId: number) {
  await prisma.suggestion.update({ where: { id: suggestionId }, data: { dismissed: true } }).catch(() => null);
}
