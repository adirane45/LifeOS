export function convertToCSV(data: Record<string, any>[], columns: string[]): string {
  const escapeValue = (value: any) => {
    if (value === null || value === undefined) {
      return '';
    }

    const text = value instanceof Date ? value.toISOString() : String(value);
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const header = columns.join(',');
  const rows = data.map((row) => columns.map((column) => escapeValue(row[column])).join(','));

  return [header, ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}