import AssistantChatClient from '../../components/assistant/AssistantChatClient';
import { getMessages } from './actions';

export const dynamic = 'force-dynamic';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export default async function AssistantPage() {
  const storedMessages = await getMessages().catch(() => []);
  const initialMessages: Message[] = storedMessages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));

  return <AssistantChatClient initialMessages={initialMessages} />;
}
