/**
 * PDF Budget Page Component
 * Budget breakdown and trip credits
 */

import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { GeneratedPlan } from '@/types/plan'
import { colors, styles as baseStyles, spacing } from './shared/styles'

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  // Budget table
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.mutedLight,
  },
  tableRowTotal: {
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 11,
    color: colors.foreground,
  },
  tableCellBold: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
  },
  tableCellTotal: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  // Column widths
  colConcepto: { width: '50%' },
  colTotal: { width: '25%', textAlign: 'right' },
  colPorPersona: { width: '25%', textAlign: 'right' },
  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.mutedLight,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
  },
  summaryCardPrimary: {
    backgroundColor: colors.primary,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryLabelLight: {
    color: colors.primaryLight,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
  },
  summaryValueLight: {
    color: colors.white,
  },
  // Disclaimer
  disclaimer: {
    backgroundColor: colors.mutedLight,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  disclaimerTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  disclaimerText: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.5,
  },
  // Credits
  credits: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  creditsLogo: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  creditsText: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  creditsUrl: {
    fontSize: 10,
    color: colors.primary,
  },
  footer: {
    ...baseStyles.footer,
  },
})

interface BudgetPageProps {
  plan: GeneratedPlan
  pageNumber: number
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface BudgetItem {
  label: string
  total: number
  perPerson: number
}

function getBudgetItems(plan: GeneratedPlan): BudgetItem[] {
  const budget = plan.budget
  if (!budget) return []

  const travelers = plan.trip.travelers || 1
  const items: BudgetItem[] = []

  if (budget.flights > 0) {
    items.push({
      label: 'Vuelos',
      total: budget.flights,
      perPerson: Math.round(budget.flights / travelers),
    })
  }

  if (budget.accommodation > 0) {
    items.push({
      label: 'Hospedaje',
      total: budget.accommodation,
      perPerson: Math.round(budget.accommodation / travelers),
    })
  }

  if (budget.activities > 0) {
    items.push({
      label: 'Actividades',
      total: budget.activities,
      perPerson: Math.round(budget.activities / travelers),
    })
  }

  if (budget.food > 0) {
    items.push({
      label: 'Alimentacion',
      total: budget.food,
      perPerson: Math.round(budget.food / travelers),
    })
  }

  if (budget.transport > 0) {
    items.push({
      label: 'Transporte local',
      total: budget.transport,
      perPerson: Math.round(budget.transport / travelers),
    })
  }

  if (budget.other > 0) {
    items.push({
      label: 'Otros gastos',
      total: budget.other,
      perPerson: Math.round(budget.other / travelers),
    })
  }

  return items
}

export function BudgetPage({ plan, pageNumber }: BudgetPageProps) {
  const budget = plan.budget
  const budgetItems = getBudgetItems(plan)
  const currency = budget?.currency || 'USD'

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Presupuesto Estimado</Text>
        <Text style={styles.subtitle}>
          Desglose de gastos para {plan.trip.travelers} viajeros
        </Text>
      </View>

      {/* Summary Cards */}
      {budget && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
            <Text style={[styles.summaryLabel, styles.summaryLabelLight]}>
              Total del viaje
            </Text>
            <Text style={[styles.summaryValue, styles.summaryValueLight]}>
              {formatCurrency(budget.total, currency)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Por persona</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(budget.perPerson, currency)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Por dia</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(
                Math.round(budget.total / (plan.summary.totalDays || 1)),
                currency
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Budget Table */}
      {budgetItems.length > 0 && (
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colConcepto]}>
              Concepto
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            <Text style={[styles.tableHeaderCell, styles.colPorPersona]}>
              Por persona
            </Text>
          </View>

          {/* Items */}
          {budgetItems.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.colConcepto]}>
                {item.label}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrency(item.total, currency)}
              </Text>
              <Text style={[styles.tableCell, styles.colPorPersona]}>
                {formatCurrency(item.perPerson, currency)}
              </Text>
            </View>
          ))}

          {/* Total Row */}
          {budget && (
            <View style={[styles.tableRow, styles.tableRowTotal]}>
              <Text style={[styles.tableCellBold, styles.colConcepto]}>
                TOTAL
              </Text>
              <Text style={[styles.tableCellTotal, styles.colTotal]}>
                {formatCurrency(budget.total, currency)}
              </Text>
              <Text style={[styles.tableCellTotal, styles.colPorPersona]}>
                {formatCurrency(budget.perPerson, currency)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Nota importante</Text>
        <Text style={styles.disclaimerText}>
          Los precios mostrados son estimados basados en promedios y pueden
          variar segun la temporada, disponibilidad y proveedores especificos.
          Este presupuesto es una guia de referencia y no constituye una
          cotizacion formal. Recomendamos verificar los precios actuales al
          momento de realizar las reservaciones.
        </Text>
      </View>

      {/* Credits */}
      <View style={styles.credits}>
        <Text style={styles.creditsLogo}>Travelr</Text>
        <Text style={styles.creditsText}>
          Tu asistente de viajes con inteligencia artificial
        </Text>
        <Text style={styles.creditsUrl}>travelr.ai</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={baseStyles.footerText}>Generado con Travelr</Text>
        <Text style={baseStyles.pageNumber}>{pageNumber}</Text>
      </View>
    </Page>
  )
}
