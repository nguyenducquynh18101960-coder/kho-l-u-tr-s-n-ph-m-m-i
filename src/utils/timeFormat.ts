/**
 * Utility helpers for accurate local / Vietnam time formatting across update notifications,
 * chat messages, and study schedule alerts.
 */

export function formatAccurateTime(
  input?: number | string | Date | null,
  fallback: string = ''
): string {
  try {
    let date: Date | null = null;
    if (typeof input === 'number' && Number.isFinite(input) && input > 0) {
      date = new Date(input);
    } else if (input instanceof Date && !Number.isNaN(input.getTime())) {
      date = input;
    } else if (typeof input === 'string' && input.trim()) {
      const asNum = Number(input);
      if (Number.isFinite(asNum) && asNum > 1000000000000) {
        date = new Date(asNum);
      } else {
        const parsed = Date.parse(input);
        if (!Number.isNaN(parsed)) {
          date = new Date(parsed);
        }
      }
    }

    if (!date || Number.isNaN(date.getTime())) {
      return fallback;
    }

    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return fallback;
  }
}

export function formatAccurateDateTime(
  input?: number | string | Date | null,
  fallback: string = ''
): string {
  try {
    let date: Date | null = null;
    if (typeof input === 'number' && Number.isFinite(input) && input > 0) {
      date = new Date(input);
    } else if (input instanceof Date && !Number.isNaN(input.getTime())) {
      date = input;
    } else if (typeof input === 'string' && input.trim()) {
      const parsed = Date.parse(input);
      if (!Number.isNaN(parsed)) {
        date = new Date(parsed);
      }
    }

    if (!date || Number.isNaN(date.getTime())) {
      return fallback;
    }

    const timePart = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const datePart = date.toLocaleDateString('vi-VN');
    return `${timePart} · ${datePart}`;
  } catch {
    return fallback;
  }
}

export function formatLocalYYYYMMDD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
