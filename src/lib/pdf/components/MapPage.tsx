/**
 * PDF Map Page Component
 * Route map, itinerary summary table, and "Includes" section
 */

import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { GeneratedPlan } from '@/types/plan'
import { colors, styles as baseStyles, spacing } from './shared/styles'
import { extractTravelBases } from '../utils/static-map'

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mapContainer: {
    width: '100%',
    height: 220,
    backgroundColor: colors.mutedLight,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: colors.muted,
  },
  // Summary table
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.mutedLight,
  },
  tableCell: {
    fontSize: 10,
    color: colors.foreground,
  },
  tableCellMuted: {
    fontSize: 10,
    color: colors.muted,
  },
  // Column widths
  colDay: { width: '12%' },
  colDate: { width: '22%' },
  colDestino: { width: '46%' },
  colNoches: { width: '20%', textAlign: 'right' },
  // Includes section
  includesContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.lg,
  },
  includesTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDark,
    marginBottom: spacing.md,
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  includeItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  includeCheck: {
    fontSize: 10,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  includeText: {
    fontSize: 9,
    color: colors.primaryDark,
    flex: 1,
  },
  // Legend for map
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  legendLine: {
    width: 20,
    height: 3,
    backgroundColor: colors.purple,
  },
  legendText: {
    fontSize: 8,
    color: colors.muted,
  },
  footer: {
    ...baseStyles.footer,
  },
})

interface MapPageProps {
  plan: GeneratedPlan
  staticMapUrl?: string | null
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function getIncludedItems(plan: GeneratedPlan): string[] {
  const items: string[] = []

  // Always included
  items.push('Itinerario detallado dia a dia')

  // Accommodation
  if (plan.accommodation?.suggestions?.length > 0) {
    const nights = plan.summary.totalNights
    items.push(`${nights} noches de hospedaje sugerido`)
  }

  // Meals
  const hasMeals = plan.itinerary.some(
    (d) => d.meals?.breakfast || d.meals?.lunch || d.meals?.dinner
  )
  if (hasMeals) {
    items.push('Sugerencias de restaurantes')
  }

  // Transport info
  const hasTransport = plan.itinerary.some((d) =>
    d.timeline.some((t) => t.travelToNext?.method === 'driving')
  )
  if (hasTransport) {
    items.push('Info de transporte entre destinos')
  }

  // Tips
  if (plan.tips && plan.tips.length > 0) {
    items.push('Tips de viaje personalizados')
  }

  // Documents
  if (plan.documents && plan.documents.length > 0) {
    items.push('Lista de documentos necesarios')
  }

  // Packing
  if (plan.packing && plan.packing.length > 0) {
    items.push('Lista de equipaje sugerido')
  }

  // Budget breakdown
  if (plan.budget) {
    items.push('Desglose de presupuesto')
  }

  return items
}

export function MapPage({ plan, staticMapUrl }: MapPageProps) {
  const bases = extractTravelBases(plan)
  const includedItems = getIncludedItems(plan)

  return (
    <Page size="A4" style={styles.page}>
      {/* Map Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ruta del Viaje</Text>

        <View style={styles.mapContainer}>
          {staticMapUrl ? (
            <Image src={staticMapUrl} style={styles.mapImage} />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>
                Mapa no disponible
              </Text>
            </View>
          )}
        </View>

        {/* Map Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Destino</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendLine} />
            <Text style={styles.legendText}>Ruta</Text>
          </View>
        </View>
      </View>

      {/* Itinerary Summary Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen del Itinerario</Text>

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDay]}>Dia</Text>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Fecha</Text>
            <Text style={[styles.tableHeaderCell, styles.colDestino]}>Destino</Text>
            <Text style={[styles.tableHeaderCell, styles.colNoches]}>Noches</Text>
          </View>

          {/* Rows */}
          {plan.itinerary.map((day, index) => {
            // Find accommodation for this day
            const accommodation = plan.accommodation?.suggestions?.find((acc) => {
              const checkIn = new Date(acc.checkIn)
              const dayDate = new Date(day.date)
              return checkIn <= dayDate && new Date(acc.checkOut) > dayDate
            })

            return (
              <View
                key={day.day}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.colDay]}>{day.day}</Text>
                <Text style={[styles.tableCellMuted, styles.colDate]}>
                  {formatShortDate(day.date)}
                </Text>
                <Text style={[styles.tableCell, styles.colDestino]}>
                  {day.title}
                </Text>
                <Text style={[styles.tableCellMuted, styles.colNoches]}>
                  {accommodation ? '1' : '-'}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Includes Section */}
      <View style={styles.section}>
        <View style={styles.includesContainer}>
          <Text style={styles.includesTitle}>Este itinerario incluye</Text>
          <View style={styles.includesGrid}>
            {includedItems.map((item, index) => (
              <View key={index} style={styles.includeItem}>
                <Text style={styles.includeCheck}>[x]</Text>
                <Text style={styles.includeText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={baseStyles.footerText}>Generado con Travelr</Text>
        <Text style={baseStyles.pageNumber}>2</Text>
      </View>
    </Page>
  )
}
