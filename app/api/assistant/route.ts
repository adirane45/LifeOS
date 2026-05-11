import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '../../../lib/prisma';
import { addTransaction, createJournalEntry, logHabit } from '../../../lib/assistantTools';
import { getAccounts, getHabits, getHealthMetrics, getJournalEntries } from '../../../lib/data';

export const runtime = 'nodejs';

type AssistantMessage = { role: 'user' | 'assistant'; content: string };

type ToolInvocation = {
  tool: 'add_transaction' | 'log_habit' | 'create_journal_entry';
  params: Record<string, any>;
};

function getErrorDetails(err: unknown) {
  if (err && typeof err === 'object') {
    const anyErr = err as any;
    const status = anyErr.status ?? anyErr.statusCode ?? anyErr.response?.status;
    const body = anyErr.body ?? anyErr.response?.body ?? anyErr.response?.data ?? anyErr.error;
    const message = anyErr.message ?? String(err);
    return { message, status, body };
  }

  return { message: String(err), status: undefined, body: undefined };
}

function extractToolInvocation(content: string): { text: string; tool?: ToolInvocation } {
  // First try to match fenced JSON block at the end
  const fencedMatch = content.match(/```json\s*([\s\S]*?)\s*```\s*$/i);
  if (fencedMatch) {
    try {
      const parsed = JSON.parse(fencedMatch[1].trim()) as ToolInvocation;
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.tool === 'string' &&
        (parsed.tool === 'add_transaction' || parsed.tool === 'log_habit' || parsed.tool === 'create_journal_entry') &&
        parsed.params &&
        typeof parsed.params === 'object'
      ) {
        const text = content.replace(fencedMatch[0], '').trim();
        return { text, tool: parsed };
      }
    } catch {
      // Fall through to raw JSON detection
    }
  }

  // Try to find raw JSON block at the end of content
  const trimmed = content.trim();
  let lastBraceIndex = trimmed.lastIndexOf('}');
  if (lastBraceIndex <= 0) {
    return { text: content };
  }

  // Find the matching opening brace
  let braceCount = 0;
  let openingBraceIndex = -1;
  for (let i = lastBraceIndex; i >= 0; i--) {
    if (trimmed[i] === '}') braceCount++;
    if (trimmed[i] === '{') {
      braceCount--;
      if (braceCount === 0) {
        openingBraceIndex = i;
        break;
      }
    }
  }

  if (openingBraceIndex < 0) {
    return { text: content };
  }

  const rawJson = trimmed.slice(openingBraceIndex);
  try {
    const parsed = JSON.parse(rawJson) as ToolInvocation;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.tool === 'string' &&
      (parsed.tool === 'add_transaction' || parsed.tool === 'log_habit' || parsed.tool === 'create_journal_entry') &&
      parsed.params &&
      typeof parsed.params === 'object'
    ) {
      const text = trimmed.slice(0, openingBraceIndex).trim();
      return { text, tool: parsed };
    }
  } catch {
    // Not valid JSON, return full content
  }

  return { text: content };
}

function buildToolConfirmation(tool: ToolInvocation, result: { ok: boolean; data?: any; error?: string }, lookup: { accounts: Map<number, any>; habits: Map<number, any> }) {
  if (!result.ok) {
    return `I couldn't complete that action: ${result.error ?? 'Unknown error.'}`;
  }

  if (tool.tool === 'add_transaction') {
    const account = lookup.accounts.get(Number(tool.params.accountId));
    const amount = Number(tool.params.amount ?? result.data?.amount ?? 0);
    const category = String(tool.params.category ?? result.data?.category ?? 'transaction');
    const type = String(tool.params.type ?? result.data?.type ?? 'transaction').toLowerCase();
    const accountName = account?.name ?? `account ${tool.params.accountId}`;
    return `Logged ₹${amount.toFixed(2)} ${type} for ${category} in ${accountName}.`;
  }

  if (tool.tool === 'log_habit') {
    const habit = lookup.habits.get(Number(tool.params.habitId));
    const habitName = habit?.name ?? `habit ${tool.params.habitId}`;
    return `Marked ${habitName} as done for today.`;
  }

  const title = String(tool.params.title ?? result.data?.title ?? 'journal entry');
  return `Created journal entry "${title}".`;
}

async function executeTool(tool: ToolInvocation) {
  switch (tool.tool) {
    case 'add_transaction':
      return addTransaction(
        Number(tool.params.accountId),
        tool.params.type,
        Number(tool.params.amount),
        String(tool.params.category ?? ''),
        tool.params.description ? String(tool.params.description) : undefined,
        tool.params.date ? String(tool.params.date) : undefined
      );
    case 'log_habit':
      return logHabit(Number(tool.params.habitId));
    case 'create_journal_entry':
      return createJournalEntry(String(tool.params.title ?? ''), String(tool.params.content ?? ''), tool.params.mood ? String(tool.params.mood) : undefined);
    default:
      return { ok: false, error: 'Unknown tool.' };
  }
}

function makeSseResponse(content: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not set in environment' }, { status: 500 });
    }

    const client = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey,
    });

    const body = await req.json();
    const messages: AssistantMessage[] = body.messages ?? [];
    const userId = 1;

    // Gather live snapshot in parallel.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [accounts, habits, metrics, journals, todaysExpensesResult] = await Promise.all([
      getAccounts(userId),
      getHabits(userId),
      getHealthMetrics(userId, 100),
      getJournalEntries(userId, 5),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          account: { userId },
          type: 'EXPENSE',
          date: {
            gte: start,
            lt: end
          }
        }
      })
    ]);
    const totalNetWorth = accounts.reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0);

    const todaysExpenses = todaysExpensesResult._sum.amount ?? 0;

    // Habits with simple streak (count of consecutive days including today)
    const habitStreaks: Array<{ id: number; name: string; streak: number }> = [];
    await Promise.all(habits.map(async (h: any) => {
      const logs = await prisma.habitLog.findMany({
        where: { habitId: h.id },
        orderBy: { date: 'desc' },
        take: 30
      });
      let streak = 0;
      let dayCursor = new Date();
      dayCursor.setHours(0, 0, 0, 0);
      for (const log of logs) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        if (logDate.getTime() === dayCursor.getTime() && log.completed) {
          streak++;
          dayCursor.setDate(dayCursor.getDate() - 1);
        } else if (logDate.getTime() < dayCursor.getTime()) {
          // stop counting
          break;
        }
      }
      habitStreaks.push({ id: h.id, name: h.name, streak });
    }));

    const latestMetricsMap = new Map<string, any>();
    for (const m of metrics) {
      if (!latestMetricsMap.has(m.type)) latestMetricsMap.set(m.type, m);
    }
    const latestMetrics = Array.from(latestMetricsMap.entries()).map(([type, metric]) => ({ type, metric }));

    // Build data summary
    const summaryLines: string[] = [];
    summaryLines.push(`Net worth: ₹${totalNetWorth.toFixed(2)}`);
    summaryLines.push(`Today's expenses: ₹${Number(todaysExpenses).toFixed(2)}`);
    summaryLines.push('Accounts:');
    for (const account of accounts) {
      summaryLines.push(`- ${account.id}: ${account.name} (${account.type}, ${account.currency}) balance ${Number(account.balance ?? 0).toFixed(2)}`);
    }
    summaryLines.push('Habits:');
    for (const h of habitStreaks) {
      summaryLines.push(`- ${h.name}: ${h.streak} day(s) streak`);
    }
    summaryLines.push('Latest health metrics:');
    for (const lm of latestMetrics) {
      summaryLines.push(`- ${lm.type}: ${lm.metric.value} ${lm.metric.unit ?? ''} (on ${new Date(lm.metric.date).toLocaleDateString()})`);
    }
    summaryLines.push('Recent journal entries:');
    for (const j of journals) {
      summaryLines.push(`- ${j.title} (${j.mood ?? 'no mood'}) on ${new Date(j.date).toLocaleDateString()}`);
    }

    // Build habit list for the system prompt
    const habitList = habitStreaks.map((h) => `{ id: ${h.id}, name: "${h.name}" }`).join(', ');

    const systemInstruction = `You are LifeOS AI, a personal assistant with deep, real-time knowledge of the user's life data. Be concise, insightful, and helpful. Reference the user's real data when relevant.

--- Tools available:
1. add_transaction(accountId: number, type: 'INCOME'|'EXPENSE', amount: number, category: string, description?: string, date?: string)
   - accountId and amount must be numbers
   - Example: { "tool": "add_transaction", "params": { "accountId": 1, "type": "EXPENSE", "amount": 500, "category": "groceries" } }

2. log_habit(habitId: number)
   - habitId MUST be a number (from the list below), NOT the habit name
   - Habit IDs: [ ${habitList} ]
   - Example: { "tool": "log_habit", "params": { "habitId": 1 } }
   - CRITICAL: When a user asks to mark a habit, use the numeric habitId from the list above.

3. create_journal_entry(title: string, content: string, mood?: string)
   - Example: { "tool": "create_journal_entry", "params": { "title": "Today's thoughts", "content": "...", "mood": "happy" } }

INSTRUCTION: If the user's request requires one of these actions, you MUST output a JSON block at the very end of your response in this exact format:
\`\`\`json
{ "tool": "tool_name", "params": { ...params... } }
\`\`\`

Use ONLY ONE tool block. Make sure it is the final content. Do not output JSON if you are only answering a question.

Here is a live snapshot:
${summaryLines.join('\n')}`;

    const messagesWithRoles = messages.filter((message) => message.role === 'user' || message.role === 'assistant');
    const lastUserIndex = [...messagesWithRoles].map((message) => message.role).lastIndexOf('user');
    const lastMessage = lastUserIndex >= 0 ? messagesWithRoles[lastUserIndex] : undefined;
    const previousMessages = messagesWithRoles.slice(0, Math.max(lastUserIndex, 0)).map((message) => ({
      role: message.role === 'user' ? ('USER' as const) : ('CHATBOT' as const),
      message: message.content
    }));
    const latestUserMessage = lastMessage?.content ?? '';

    const createCompletion = async (model: 'llama-3.3-70b-versatile' | 'mixtral-8x7b-32768') =>
      client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          ...previousMessages.map((message) => ({
            role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
            content: message.message
          })),
          {
            role: 'user',
            content: latestUserMessage
          }
        ],
        stream: true
      });

    let completion;
    try {
      completion = await createCompletion('llama-3.3-70b-versatile');
    } catch (error) {
      const details = getErrorDetails(error);
      if (details.status === 404) {
        completion = await createCompletion('mixtral-8x7b-32768');
      } else {
        return NextResponse.json(
          {
            error: details.message,
            details: typeof details.body === 'string' ? details.body : JSON.stringify(details.body ?? null),
            status: details.status ?? 500
          },
          { status: 500 }
        );
      }
    }

    // **PASS 1**: Collect the entire streamed response into a buffer
    let fullResponse = '';
    for await (const chunk of completion) {
      const text = chunk.choices?.[0]?.delta?.content || '';
      if (text) fullResponse += text;
    }

    // Parse for tool invocation in the full response
    const extracted = extractToolInvocation(fullResponse);
    let finalResponseToStream = '';

    if (extracted.tool) {
      // Tool was found; execute it server-side
      const accountsById = new Map<number, any>(accounts.map((account: any) => [account.id, account]));
      const habitsById = new Map<number, any>(habitStreaks.map((habit: any) => [habit.id, habit]));
      const toolResult = await executeTool(extracted.tool);
      
      // Build a simple confirmation message
      const confirmation = buildToolConfirmation(extracted.tool, toolResult, { accounts: accountsById, habits: habitsById });
      finalResponseToStream = confirmation;
    } else {
      // No tool found; use the cleaned response (with trailing JSON removed)
      finalResponseToStream = extracted.text || fullResponse || 'I am ready to help.';
    }

    // Stream the final response to the client
    return makeSseResponse(finalResponseToStream);
  } catch (err: any) {
    const details = getErrorDetails(err);
    return NextResponse.json(
      {
        error: details.message,
        details: typeof details.body === 'string' ? details.body : JSON.stringify(details.body ?? null),
        status: details.status ?? 500
      },
      { status: 500 }
    );
  }
}
