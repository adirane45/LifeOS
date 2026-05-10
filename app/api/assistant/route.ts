import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '../../../lib/prisma';

export const runtime = 'nodejs';

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
    const messages: Array<{ role: string; content: string }> = body.messages ?? [];

    // Gather live snapshot from Prisma
    // Total net worth
    const accounts = await prisma.account.findMany();
    const totalNetWorth = accounts.reduce((s, a) => s + Number(a.balance ?? 0), 0);

    // Today's expenses
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const todaysExpensesResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'EXPENSE',
        date: {
          gte: start,
          lt: end
        }
      }
    });
    const todaysExpenses = todaysExpensesResult._sum.amount ?? 0;

    // Habits with simple streak (count of consecutive days including today)
    const habits = await prisma.habit.findMany({ where: { userId: 1 } });
    const habitStreaks: Array<{ id: number; name: string; streak: number }> = [];
    for (const h of habits) {
      const logs = await prisma.habitLog.findMany({
        where: { habitId: h.id },
        orderBy: { date: 'desc' }
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
    }

    // Latest health metrics (most recent by type)
    const metrics = await prisma.healthMetric.findMany({ where: { userId: 1 }, orderBy: { date: 'desc' } });
    const latestMetricsMap = new Map<string, any>();
    for (const m of metrics) {
      if (!latestMetricsMap.has(m.type)) latestMetricsMap.set(m.type, m);
    }
    const latestMetrics = Array.from(latestMetricsMap.entries()).map(([type, metric]) => ({ type, metric }));

    // Last 5 journal entries
    const journals = await prisma.journalEntry.findMany({ where: { userId: 1 }, orderBy: { date: 'desc' }, take: 5 });

    // Build data summary
    const summaryLines: string[] = [];
    summaryLines.push(`Net worth: $${totalNetWorth.toFixed(2)}`);
    summaryLines.push(`Today's expenses: $${Number(todaysExpenses).toFixed(2)}`);
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

    const systemInstruction = `You are LifeOS AI, a personal assistant with deep, real-time knowledge of the user's life data. Be concise, insightful, and helpful. Reference the user's real data when relevant. Here is a live snapshot:\n${summaryLines.join('\n')}`;

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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices?.[0]?.delta?.content || '';
            if (!text) continue;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err: any) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
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
