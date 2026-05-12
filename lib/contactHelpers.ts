export type ImportantDateItem = {
  label: string;
  date: string;
};

export type ContactRecord = {
  id: number;
  userId: number;
  name: string;
  relationship: string | null;
  birthday: Date | string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  importantDates: unknown;
  lastContacted: Date | string | null;
  remindAfterDays: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeImportantDates(value: unknown): ImportantDateItem[] {
  if (!value) {
    return [];
  }

  let rawItems: unknown = value;
  if (typeof value === 'string') {
    try {
      rawItems = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { label?: unknown; date?: unknown };
      const label = String(candidate.label ?? '').trim();
      const dateValue = String(candidate.date ?? '').trim();

      if (!label || !dateValue) {
        return null;
      }

      const parsedDate = new Date(dateValue);
      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }

      return {
        label,
        date: parsedDate.toISOString()
      };
    })
    .filter((item): item is ImportantDateItem => item !== null);
}

export function getDaysSince(date: Date | string | null | undefined, now = new Date()) {
  const parsedDate = toDate(date);
  if (!parsedDate) {
    return null;
  }

  const start = startOfDay(parsedDate).getTime();
  const end = startOfDay(now).getTime();
  return Math.max(0, Math.floor((end - start) / (24 * 60 * 60 * 1000)));
}

export function getNextBirthdayInfo(birthday: Date | string | null | undefined, now = new Date()) {
  const parsedBirthday = toDate(birthday);
  if (!parsedBirthday) {
    return null;
  }

  const today = startOfDay(now);
  const currentYearBirthday = new Date(today.getFullYear(), parsedBirthday.getMonth(), parsedBirthday.getDate());
  const nextBirthday = currentYearBirthday < today ? new Date(today.getFullYear() + 1, parsedBirthday.getMonth(), parsedBirthday.getDate()) : currentYearBirthday;
  const daysUntil = Math.round((startOfDay(nextBirthday).getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  return {
    nextBirthday,
    daysUntil
  };
}

export function getContactAttentionAge(contact: Pick<ContactRecord, 'createdAt' | 'lastContacted' | 'remindAfterDays'>, now = new Date()) {
  return getDaysSince(contact.lastContacted ?? contact.createdAt, now);
}

export function getContactOverdueDays(contact: Pick<ContactRecord, 'createdAt' | 'lastContacted' | 'remindAfterDays'>, now = new Date()) {
  const attentionAge = getContactAttentionAge(contact, now);
  if (attentionAge === null) {
    return null;
  }

  return Math.max(0, attentionAge - (contact.remindAfterDays ?? 30));
}

export function isContactOverdue(contact: Pick<ContactRecord, 'createdAt' | 'lastContacted' | 'remindAfterDays'>, now = new Date()) {
  const overdueDays = getContactOverdueDays(contact, now);
  return overdueDays !== null && overdueDays > 0;
}
