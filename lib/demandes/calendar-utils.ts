import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getDate,
  isSameMonth,
  isWithinInterval,
  format,
  differenceInDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  dayNumber: number;
}

/**
 * Génère une grille de 42 jours (6 semaines) pour un mois donné
 * Commence le lundi
 */
export function getDaysInMonthGrid(year: number, month: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);

  // Commence le lundi (weekStartsOn: 1)
  const gridStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // S'assurer qu'on a exactement 42 jours (6 semaines)
  const calendarDays: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = days[i] || new Date(gridEnd.getTime() + (i - days.length + 1) * 86400000);
    calendarDays.push({
      date,
      isCurrentMonth: isSameMonth(date, firstDayOfMonth),
      dayNumber: getDate(date),
    });
  }

  return calendarDays;
}

/**
 * Retourne le premier lundi du mois ou avant
 */
export function startOfMonthMonday(date: Date): Date {
  const firstDay = startOfMonth(date);
  return startOfWeek(firstDay, { weekStartsOn: 1 });
}

/**
 * Vérifie si une date est dans une période donnée (inclusive)
 */
export function isInRange(date: Date, start: Date, end: Date): boolean {
  // Normaliser les dates à minuit pour comparaison
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return isWithinInterval(normalizedDate, { start: normalizedStart, end: normalizedEnd });
}

/**
 * Retourne le nom français du mois (capitalisé)
 */
export function getMonthName(month: number): string {
  const date = new Date(2026, month, 1);
  const name = format(date, 'MMMM', { locale: fr });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Retourne les initiales des jours de la semaine (commence lundi)
 */
export function getWeekDayNames(): string[] {
  return ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
}

/**
 * Formate une période : "15-21 mars 2026"
 */
export function formatPeriod(start: Date, end: Date): string {
  const startDay = getDate(start);
  const endDay = getDate(end);
  const startMonth = format(start, 'MMMM', { locale: fr });
  const endMonth = format(end, 'MMMM', { locale: fr });
  const endYear = end.getFullYear();

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay}-${endDay} ${startMonth} ${endYear}`;
  } else if (start.getFullYear() === end.getFullYear()) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
  } else {
    const startYear = start.getFullYear();
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  }
}

/**
 * Compte le nombre de jours entre deux dates (inclusif)
 */
export function countDaysBetween(start: Date, end: Date): number {
  return differenceInDays(end, start) + 1;
}

/**
 * Formate une date complète : "15 mars 2026"
 */
export function formatDateFull(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: fr });
}
