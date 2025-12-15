/**
 * PDF Cover Page Component
 * First page with hero image, title, and trip overview
 */

import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { GeneratedPlan } from '@/types/plan'
import { colors, styles as baseStyles, spacing } from './shared/styles'

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
    padding: 0,
  },
  heroContainer: {
    width: '100%',
    height: 280,
    backgroundColor: colors.mutedLight,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    color: colors.white,
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
  },
  content: {
    padding: 40,
    flex: 1,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDark,
  },
  datesSection: {
    marginTop: spacing.xl,
  },
  datesLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  datesText: {
    fontSize: 14,
    color: colors.foreground,
    fontFamily: 'Helvetica-Bold',
  },
  budgetSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.mutedLight,
    padding: spacing.lg,
    borderRadius: 8,
  },
  budgetLabel: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  budgetTotal: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  budgetPerPerson: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  highlightsSection: {
    marginTop: spacing.xl,
  },
  highlightsTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  highlightBullet: {
    fontSize: 10,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  highlightText: {
    fontSize: 10,
    color: colors.foreground,
    flex: 1,
  },
  footer: {
    ...baseStyles.footer,
    left: 40,
    right: 40,
  },
})

interface CoverPageProps {
  plan: GeneratedPlan
  heroImage?: string | null
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  }

  const startStr = start.toLocaleDateString('es-ES', formatOptions)
  const endStr = end.toLocaleDateString('es-ES', {
    ...formatOptions,
    year: 'numeric',
  })

  return `${startStr} - ${endStr}`
}

export function CoverPage({ plan, heroImage }: CoverPageProps) {
  const { trip, summary, budget } = plan

  return (
    <Page size="A4" style={styles.page}>
      {/* Hero Image */}
      <View style={styles.heroContainer}>
        {heroImage ? (
          <Image src={heroImage} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>
              {trip.destination.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{summary.title}</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            {summary.totalDays} dias / {summary.totalNights} noches
          </Text>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{trip.travelers} viajeros</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Itinerario</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Hospedaje</Text>
            </View>
            {summary.totalDriving && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{summary.totalDriving.distance}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesSection}>
          <Text style={styles.datesLabel}>Fechas del viaje</Text>
          <Text style={styles.datesText}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
        </View>

        {/* Budget */}
        {budget && (
          <View style={styles.budgetSection}>
            <Text style={styles.budgetLabel}>Presupuesto estimado</Text>
            <Text style={styles.budgetTotal}>
              {formatCurrency(budget.total, budget.currency)}
            </Text>
            <Text style={styles.budgetPerPerson}>
              ({formatCurrency(budget.perPerson, budget.currency)} por persona)
            </Text>
          </View>
        )}

        {/* Highlights */}
        {summary.highlights && summary.highlights.length > 0 && (
          <View style={styles.highlightsSection}>
            <Text style={styles.highlightsTitle}>Destacados del viaje</Text>
            {summary.highlights.slice(0, 5).map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Text style={styles.highlightBullet}>-</Text>
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={baseStyles.footerText}>Generado con Travelr</Text>
        <Text style={baseStyles.footerText}>travelr.ai</Text>
      </View>
    </Page>
  )
}
