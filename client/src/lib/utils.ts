import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericAmount);
}

export function formatDate(date: Date | string): string {
  // Handle date strings and avoid timezone issues
  if (typeof date === 'string') {
    // If it's an ISO date string, parse it as local date to avoid timezone shifts
    if (date.includes('T')) {
      const isoDate = date.split('T')[0];
      const [year, month, day] = isoDate.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('pt-BR').format(localDate);
    } else {
      // For date-only strings like "2025-07-08", parse as local date
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('pt-BR').format(localDate);
    }
  }
  
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}
