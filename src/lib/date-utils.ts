/**
 * Date utilities for consistent date formatting across the app.
 *
 * IMPORTANT: These functions handle ISO date strings (YYYY-MM-DD) correctly
 * by parsing them as LOCAL dates, not UTC. This avoids the common bug where
 * "2024-12-07" displays as "6 dic" due to timezone conversion.
 */

/**
 * Parsea un ISO date string (YYYY-MM-DD) como fecha LOCAL (no UTC)
 *
 * @example
 * parseLocalDate("2024-12-07") // Returns Date for Dec 7, 2024 in local timezone
 */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Formatea fecha ISO a formato corto español: "7 dic"
 *
 * @example
 * formatDateShort("2024-12-07") // "7 dic"
 */
export function formatDateShort(isoDate: string): string {
  if (!isoDate) return ""
  const date = parseLocalDate(isoDate)
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
}

/**
 * Formatea fecha ISO con día de semana corto: "sáb, 7 dic"
 *
 * @example
 * formatDateWithWeekday("2024-12-07") // "sáb, 7 dic"
 */
export function formatDateWithWeekday(isoDate: string): string {
  if (!isoDate) return ""
  const date = parseLocalDate(isoDate)
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

/**
 * Formatea fecha ISO a formato largo: "7 de diciembre de 2024"
 *
 * @example
 * formatDateLong("2024-12-07") // "7 de diciembre de 2024"
 */
export function formatDateLong(isoDate: string): string {
  if (!isoDate) return ""
  const date = parseLocalDate(isoDate)
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Formatea fecha ISO a formato medio: "7 dic 2024"
 *
 * @example
 * formatDateMedium("2024-12-07") // "7 dic 2024"
 */
export function formatDateMedium(isoDate: string): string {
  if (!isoDate) return ""
  const date = parseLocalDate(isoDate)
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * Formatea un rango de fechas: "7 - 10 dic" o "7 dic - 3 ene"
 *
 * @example
 * formatDateRange("2024-12-07", "2024-12-10") // "7 - 10 dic"
 * formatDateRange("2024-12-07", "2025-01-03") // "7 dic - 3 ene"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ""

  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    return `${start.getDate()} - ${end.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
  }

  return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`
}
