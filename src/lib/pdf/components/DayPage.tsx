/**
 * PDF Day Page Component
 * Detailed itinerary for each day
 */

import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { GeneratedPlan, ItineraryDay, ImportantNote, NoteCategory } from '@/types/plan'
import { colors, styles as baseStyles, spacing } from './shared/styles'

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  dayHeader: {
    backgroundColor: colors.primary,
    marginHorizontal: -40,
    marginTop: -40,
    paddingHorizontal: 40,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  dayNumber: {
    fontSize: 10,
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  dayTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  daySubtitle: {
    fontSize: 12,
    color: colors.primaryLight,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  // Timeline
  timeline: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
    marginLeft: spacing.sm,
  },
  timelineItem: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -22,
    top: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  timelineTime: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 2,
  },
  timelineActivity: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 9,
    color: colors.muted,
  },
  timelineNotes: {
    fontSize: 9,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Travel info
  travelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  travelLine: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  travelText: {
    fontSize: 8,
    color: colors.muted,
  },
  // Accommodation
  accommodationCard: {
    backgroundColor: colors.mutedLight,
    borderRadius: 6,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  accommodationTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  accommodationText: {
    fontSize: 9,
    color: colors.muted,
  },
  // Notes
  notesContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    padding: spacing.md,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  noteIcon: {
    fontSize: 10,
    marginRight: spacing.xs,
    width: 16,
  },
  noteText: {
    fontSize: 9,
    color: colors.primaryDark,
    flex: 1,
  },
  noteHighPriority: {
    fontFamily: 'Helvetica-Bold',
  },
  // Meals
  mealsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mealCard: {
    flex: 1,
    backgroundColor: colors.mutedLight,
    borderRadius: 6,
    padding: spacing.sm,
  },
  mealLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mealText: {
    fontSize: 9,
    color: colors.foreground,
  },
  // Footer
  footer: {
    ...baseStyles.footer,
  },
})

interface DayPageProps {
  day: ItineraryDay
  plan: GeneratedPlan
  pageNumber: number
}

// ASCII characters compatible with PDF renderer (emojis not supported)
const NOTE_ICONS: Record<NoteCategory, string> = {
  time: '>',
  transport: '>',
  weather: '*',
  activity: '>',
  food: '*',
  lodging: '*',
  budget: '$',
  gear: '*',
  warning: '!',
  tip: '*',
}

function formatDayDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function DayPage({ day, plan, pageNumber }: DayPageProps) {
  // Find accommodation for this day
  const accommodation = plan.accommodations?.find((acc) => {
    const checkIn = new Date(acc.checkIn)
    const checkOut = new Date(acc.checkOut)
    const dayDate = new Date(day.date)
    return checkIn <= dayDate && checkOut > dayDate
  })

  return (
    <Page size="A4" style={styles.page}>
      {/* Day Header */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayNumber}>
          Dia {day.day} - {formatDayDate(day.date)}
        </Text>
        <Text style={styles.dayTitle}>{day.title}</Text>
        {day.subtitle && (
          <Text style={styles.daySubtitle}>{day.subtitle}</Text>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividades</Text>
        <View style={styles.timeline}>
          {day.timeline.map((entry, index) => (
            <View key={entry.id}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineTime}>{entry.time}</Text>
                <Text style={styles.timelineActivity}>
                  {entry.activity}
                </Text>
                {entry.location && (
                  <Text style={styles.timelineLocation}>{entry.location}</Text>
                )}
                {entry.notes && (
                  <Text style={styles.timelineNotes}>{entry.notes}</Text>
                )}
              </View>

              {/* Travel info to next */}
              {entry.travelToNext && entry.travelToNext.method !== 'none' && index < day.timeline.length - 1 && (
                <View style={styles.travelInfo}>
                  <View style={styles.travelLine} />
                  <Text style={styles.travelText}>
                    {entry.travelToNext.method === 'driving' ? 'En auto:' : 'A pie:'}{' '}
                    {entry.travelToNext.distance} - {entry.travelToNext.duration}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Meals */}
      {(day.meals.breakfast || day.meals.lunch || day.meals.dinner) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comidas</Text>
          <View style={styles.mealsRow}>
            {day.meals.breakfast && (
              <View style={styles.mealCard}>
                <Text style={styles.mealLabel}>Desayuno</Text>
                <Text style={styles.mealText}>{day.meals.breakfast.suggestion}</Text>
              </View>
            )}
            {day.meals.lunch && (
              <View style={styles.mealCard}>
                <Text style={styles.mealLabel}>Almuerzo</Text>
                <Text style={styles.mealText}>{day.meals.lunch.suggestion}</Text>
              </View>
            )}
            {day.meals.dinner && (
              <View style={styles.mealCard}>
                <Text style={styles.mealLabel}>Cena</Text>
                <Text style={styles.mealText}>{day.meals.dinner.suggestion}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Accommodation */}
      {accommodation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alojamiento</Text>
          <View style={styles.accommodationCard}>
            <Text style={styles.accommodationTitle}>{accommodation.name}</Text>
            <Text style={styles.accommodationText}>
              {accommodation.area} - {accommodation.nights} {accommodation.nights === 1 ? 'noche' : 'noches'}
            </Text>
            {accommodation.checkInTime && (
              <Text style={styles.accommodationText}>
                Check-in: {accommodation.checkInTime}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Important Notes */}
      {day.importantNotes && day.importantNotes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Importantes</Text>
          <View style={styles.notesContainer}>
            {day.importantNotes.slice(0, 6).map((note) => (
              <View key={note.id} style={styles.noteItem}>
                <Text style={styles.noteIcon}>
                  {NOTE_ICONS[note.category] || '-'}
                </Text>
                <Text
                  style={[
                    styles.noteText,
                    note.isHighPriority ? styles.noteHighPriority : {},
                  ]}
                >
                  {note.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={baseStyles.footerText}>Generado con Travelr</Text>
        <Text style={baseStyles.pageNumber}>{pageNumber}</Text>
      </View>
    </Page>
  )
}
