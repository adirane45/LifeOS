export function getMoodEmoji(mood: string | null): string {
  if (!mood) return '😐';
  const lower = mood.toLowerCase();
  if (lower.includes('happy') || lower.includes('great') || lower.includes('excellent')) return '😊';
  if (lower.includes('sad') || lower.includes('bad') || lower.includes('terrible')) return '😢';
  if (lower.includes('angry') || lower.includes('frustrated')) return '😠';
  if (lower.includes('anxious') || lower.includes('nervous')) return '😰';
  if (lower.includes('calm') || lower.includes('peaceful')) return '😌';
  return '😐';
}
