---
name: skill-travel-domain
description: Travel industry knowledge for Travelr (itineraries, places, booking patterns)
topics: ["travel", "itinerary", "google-places", "tourism", "ux-patterns"]
---

# Travel Domain Skill

Knowledge about the travel industry, user behavior, and Travelr-specific patterns.

---

## Travelr Domain Types

**File**: `src/types/plan.ts`

### Travel Preferences

```typescript
type TravelStyle = 'budget' | 'comfort' | 'luxury'
type TravelPace = 'relaxed' | 'moderate' | 'active'
type TransportMethod = 'driving' | 'walking' | 'transit' | 'none'
```

### Activity Types

```typescript
// Regular activity (visit, experience, meal)
interface TimelineEntry {
  id: string
  time: string           // "09:00"
  activity: string       // Name of the activity
  location: string       // Address or location name
  icon: string           // lucide-react icon name
  coordinates?: {
    lat: number
    lng: number
  }
  placeData?: PlaceData  // Google Places data
  duration?: number      // Minutes
  notes?: string
}

// Transport block (auto-generated between activities)
interface TransportBlock {
  id: string
  type: 'transport'
  mode: TransportMethod
  duration: number       // Minutes
  distance?: number      // Meters
  from: string
  to: string
}

// Accommodation
interface AccommodationSuggestion {
  id: string
  name: string
  type: 'hotel' | 'airbnb' | 'hostel'
  pricePerNight: number
  rating: number
  location: string
  coordinates: { lat: number; lng: number }
  amenities: string[]
  imageUrl?: string
}
```

### Itinerary Structure

```typescript
interface ItineraryDay {
  day: number              // 1, 2, 3...
  date: string             // "2024-12-07"
  location: string         // City/area for the day
  timeline: TimelineEntry[]
  accommodation?: AccommodationSuggestion
}

interface GeneratedPlan {
  id: string
  trip: Trip
  itinerary: ItineraryDay[]
  accommodation?: AccommodationSuggestion[]
  totalEstimatedCost?: number
}
```

---

## Traveler Psychology

### Key User Needs

1. **Optimization**: Want best value for time and money
2. **Discovery**: Want to find hidden gems, not just tourist traps
3. **Safety**: Need confidence that plans are realistic
4. **Flexibility**: Want to customize, not follow rigid itineraries
5. **Social Proof**: Trust ratings and reviews

### Common Pain Points

1. **Over-planning**: Cramming too much into one day
2. **Under-planning**: Missing key attractions
3. **Logistics**: Not accounting for travel time between places
4. **Timing**: Visiting places when they're closed or crowded
5. **Budget**: Unexpected costs adding up

### UX Principles for Travel Apps

- Show everything at once (canvas, not wizard)
- Make editing easy (drag & drop, inline edits)
- Provide smart defaults (suggested times, popular places)
- Show context (maps, photos, ratings)
- Handle uncertainty (weather, closures, delays)

---

## Itinerary Best Practices

### Daily Structure

A typical travel day:
```
08:00 - 09:00  Breakfast
09:30 - 12:00  Morning activity (museum, tour, etc.)
12:30 - 14:00  Lunch
14:30 - 17:00  Afternoon activity
17:30 - 19:00  Free time / shopping
19:30 - 21:00  Dinner
21:30+         Evening activity (optional)
```

### Time Allocations

| Activity Type | Typical Duration |
|---------------|------------------|
| Major museum | 2-3 hours |
| Small museum | 1-1.5 hours |
| Historic site | 1-2 hours |
| Beach time | 2-4 hours |
| Shopping | 1-2 hours |
| Meal | 1-1.5 hours |
| Coffee break | 30 min |
| Walking tour | 2-3 hours |

### Pace Guidelines

| Pace | Activities/Day | Buffer Time |
|------|----------------|-------------|
| Relaxed | 2-3 | 30+ min between |
| Moderate | 3-4 | 20-30 min between |
| Active | 4-6 | 15-20 min between |

### Transport Considerations

- **Walking**: Up to 2km between activities is walkable
- **Transit**: Add 15-30 min buffer for public transit
- **Driving**: Account for parking time (10-20 min)
- **Rush hour**: Add 50% extra time in major cities

---

## Google Places Integration

### Categories Mapping

```typescript
const PLACE_CATEGORIES = {
  // Attractions
  tourist_attraction: { icon: 'Camera', label: 'Attraction' },
  museum: { icon: 'Landmark', label: 'Museum' },
  park: { icon: 'Trees', label: 'Park' },
  amusement_park: { icon: 'Ferris', label: 'Theme Park' },
  zoo: { icon: 'Squirrel', label: 'Zoo' },
  aquarium: { icon: 'Fish', label: 'Aquarium' },

  // Food & Drink
  restaurant: { icon: 'Utensils', label: 'Restaurant' },
  cafe: { icon: 'Coffee', label: 'Cafe' },
  bar: { icon: 'Wine', label: 'Bar' },
  bakery: { icon: 'Croissant', label: 'Bakery' },

  // Shopping
  shopping_mall: { icon: 'ShoppingBag', label: 'Mall' },
  store: { icon: 'Store', label: 'Store' },

  // Services
  lodging: { icon: 'Hotel', label: 'Hotel' },
  spa: { icon: 'Sparkles', label: 'Spa' },
}
```

### Place Data Structure

```typescript
interface PlaceData {
  place_id: string
  name: string
  formatted_address: string
  coordinates: { lat: number; lng: number }
  types: string[]
  rating?: number
  user_ratings_total?: number
  price_level?: number  // 0-4
  opening_hours?: {
    open_now: boolean
    periods: Array<{
      open: { day: number; time: string }
      close: { day: number; time: string }
    }>
  }
  photos?: Array<{
    photo_reference: string
    width: number
    height: number
  }>
  website?: string
  phone?: string
}
```

### API Integration Patterns

```typescript
// Search places near a location
const response = await fetch('/api/places/search', {
  method: 'POST',
  body: JSON.stringify({
    query: 'museums',
    location: { lat: 9.9281, lng: -84.0907 }, // San José, Costa Rica
    radius: 5000, // meters
  }),
})

// Get place details
const response = await fetch(`/api/places/${placeId}`)

// Get directions between places
const response = await fetch('/api/directions', {
  method: 'POST',
  body: JSON.stringify({
    origin: { lat: 9.9281, lng: -84.0907 },
    destination: { lat: 9.9341, lng: -84.0875 },
    mode: 'driving',
  }),
})
```

---

## Caching Strategy

### Directions Cache

- Cache key: normalized coordinates + mode
- TTL: 30 days (routes don't change often)
- Location: `directions_cache` table in Supabase

```typescript
// Generate deterministic cache key
function generateCacheKey(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: string
): string {
  // Round to 4 decimal places (~11m precision)
  const roundCoord = (n: number) => Math.round(n * 10000) / 10000
  return `${roundCoord(originLat)}_${roundCoord(originLng)}_${roundCoord(destLat)}_${roundCoord(destLng)}_${mode}`
}
```

### Reference: `src/app/api/directions/route.ts`

---

## AI Generation Context

When AI generates itineraries, it considers:

1. **User preferences**: Style, pace, interests
2. **Trip details**: Dates, travelers, budget
3. **Destination**: Popular attractions, local customs
4. **Logistics**: Opening hours, distances, transport
5. **Balance**: Mix of activities, rest time, meals

### Generation Prompt Considerations

```markdown
Generate a {pace} paced itinerary for {travelers} travelers
visiting {destination} from {start_date} to {end_date}.

Travel style: {style}
Interests: {interests}

Requirements:
- Include breakfast, lunch, and dinner
- Account for travel time between activities
- Consider opening hours
- Balance tourist attractions with local experiences
- Include rest/free time
- Stay within {budget} budget
```

---

## Feature Ideas by Pain Point

| Pain Point | Feature Solution |
|------------|------------------|
| Over-planning | Show warnings when day is too packed |
| Missing attractions | Suggest "must-see" places for destination |
| Travel time | Auto-calculate and show transport blocks |
| Timing | Show opening hours, warn about closures |
| Budget | Track estimated costs per day |
| Weather | Show forecast for each day |
| Sharing | Generate shareable trip link |
| Offline | Download itinerary for offline access |
