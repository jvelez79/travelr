# Design System - Travelr

Este documento define el sistema de diseño de Travelr. Todos los nuevos features deben seguir estas guías para mantener consistencia visual.

## Filosofía de Diseño

**"Modern Travel Tech"** - Un diseño limpio y contemporáneo con colores teal que reflejan la identidad del logo. Tipografía sans-serif para claridad y modernidad. Profesional y confiable, inspirado en las mejores plataformas de tecnología de viajes.

### Principios

1. **Claridad primero** - Layouts limpios, fonts legibles, jerarquía visual clara
2. **Confianza cool** - Tonos teal profesionales y orientados a viajes
3. **Minimalismo moderno** - Menos ornamentación, foco en contenido
4. **Marca consistente** - Colores alineados con el logo teal/cyan
5. **Colores funcionales preservados** - Verde/amber/rojo para estados de actividades
6. **Animaciones sutiles** - Movimiento con propósito, no distracción

---

## Paleta de Colores

### Colores Semánticos (CSS Variables)

```css
/* Modo Claro */
--background: #F8FAFC;      /* Fondo principal - slate frío */
--foreground: #0F172A;      /* Texto principal - slate profundo */
--card: #FFFFFF;            /* Fondo de tarjetas */
--card-foreground: #0F172A;

--primary: #0D9488;         /* Teal - acciones principales (color del logo) */
--primary-foreground: #F0FDFA;

--secondary: #F1F5F9;       /* Fondos secundarios - slate claro */
--secondary-foreground: #475569;

--muted: #F1F5F9;           /* Elementos atenuados */
--muted-foreground: #64748B;

--accent: #CCFBF1;          /* Acentos (teal suave) */
--accent-foreground: #134E4A;

--destructive: #DC2626;     /* Errores y alertas */
--border: #E2E8F0;          /* Bordes - slate */
--ring: #0D9488;            /* Focus rings */

/* Chart colors - familia teal/cyan */
--chart-1: #0D9488;         /* Teal-600 */
--chart-2: #4ECDC4;         /* Cyan del logo */
--chart-3: #0891B2;         /* Cyan-600 */
--chart-4: #14B8A6;         /* Teal-500 */
--chart-5: #06B6D4;         /* Cyan-500 */
```

### Modo Oscuro

```css
/* Modo Oscuro */
--background: #0F172A;      /* slate-900 */
--foreground: #F8FAFC;
--card: #1E293B;            /* slate-800 */
--card-foreground: #F8FAFC;

--primary: #2DD4BF;         /* Teal-400 - más brillante */
--primary-foreground: #042F2E;

--secondary: #1E293B;
--secondary-foreground: #CBD5E1;

--muted: #1E293B;
--muted-foreground: #94A3B8;

--accent: #115E59;          /* Teal-800 */
--accent-foreground: #5EEAD4;

--destructive: #EF4444;
--border: #334155;
--ring: #2DD4BF;
```

### Uso de Colores

| Elemento | Color | Clase Tailwind |
|----------|-------|----------------|
| Botón primario | Teal | `bg-primary text-primary-foreground` |
| Texto principal | Slate oscuro | `text-foreground` |
| Texto secundario | Slate medio | `text-muted-foreground` |
| Fondos de sección | Muted | `bg-muted/30` |
| Bordes | Slate claro | `border-border` |
| Elementos seleccionados | Primary con opacidad | `bg-primary/5 border-primary` |
| Badges destacados | Primary | `bg-primary/10 text-primary` |
| Tips/Info | Amber | `bg-amber-50 border-amber-200` |
| Errores | Red | `bg-destructive/10 text-destructive` |

### Colores Adicionales

```css
/* Badges personalizados */
.badge-primary /* Teal suave - bg-primary/10 */
.badge-success /* Verde - para estados de éxito */
.badge-teal    /* Teal - para acentos informativos */
```

---

## Tipografía

### Fuentes

| Uso | Fuente | Variable CSS |
|-----|--------|--------------|
| Títulos (h1-h6) | Inter | `--font-inter` |
| Cuerpo/UI | Inter | `--font-inter` |

Inter es una familia tipográfica sans-serif diseñada para pantallas, con excelente legibilidad en todos los tamaños.

### Escala Tipográfica

```jsx
// Títulos - usar clase font-semibold con letter-spacing negativo
<h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
<h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
<h3 className="text-xl sm:text-2xl font-semibold">
<h4 className="text-lg font-semibold">

// Cuerpo
<p className="text-lg text-muted-foreground leading-relaxed">  // Descripción grande
<p className="text-base">                                       // Texto normal
<p className="text-sm text-muted-foreground">                  // Texto secundario
<span className="text-xs text-muted-foreground">               // Labels pequeños
```

### Labels y Etiquetas

```jsx
// Section labels (encima de títulos)
<span className="text-sm font-medium text-primary uppercase tracking-wider">
  Metodología
</span>

// Input labels
<Label className="text-base font-medium">
```

---

## Espaciado

### Sistema de Espaciado

Usar múltiplos de 4px (sistema de Tailwind):

| Uso | Valor | Clase |
|-----|-------|-------|
| Padding de tarjetas | 24px | `p-6` |
| Gap entre secciones | 96px | `py-24` |
| Gap entre elementos | 16px | `gap-4` |
| Margen entre párrafos | 16-24px | `mb-4` o `mb-6` |
| Container max-width | 1152px | `max-w-6xl` |
| Form max-width | 576px | `max-w-xl` |

### Contenedores

```jsx
// Página principal
<div className="max-w-6xl mx-auto px-6">

// Formularios centrados
<div className="max-w-xl mx-auto px-6">

// Contenido de lectura
<div className="max-w-2xl mx-auto">
```

---

## Componentes

### Botones

```jsx
// Primario
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">

// Con sombra (CTA destacado)
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30">

// Outline
<Button variant="outline" className="border-border hover:bg-muted">

// Tamaños
<Button size="lg" className="h-12 px-8 text-base">  // Grande
<Button size="sm" className="h-9">                   // Pequeño
```

### Tarjetas

```jsx
// Tarjeta básica
<div className="bg-card rounded-xl border border-border p-6">

// Tarjeta con hover
<div className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-all card-hover">

// Tarjeta seleccionable
<button className={`
  w-full text-left p-5 rounded-xl border-2 transition-all
  ${selected
    ? "border-primary bg-primary/5"
    : "border-border bg-card hover:border-primary/30"
  }
`}>
```

### Badges

```jsx
// Badge primario
<span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">

// Badge con indicador
<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium badge-primary">
  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
  Texto
</span>

// Badge pequeño
<span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
```

### Inputs

```jsx
<Input className="h-12 text-base bg-card border-border focus:border-primary" />

// Con label
<div className="space-y-2">
  <Label className="text-base font-medium">Label</Label>
  <Input className="h-12 text-base bg-card border-border" />
</div>
```

### Progress Bar

```jsx
<div className="h-1.5 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-primary to-[#4ECDC4] rounded-full transition-all duration-300"
    style={{ width: `${percentage}%` }}
  />
</div>

// Usando clase utilitaria
<div className="progress-modern">
  <div style={{ width: `${percentage}%` }} />
</div>
```

### Info Cards / Alerts

```jsx
// Info (amber)
<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5">
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
      {/* Icon */}
    </div>
    <div>
      <h4 className="font-semibold text-amber-900 dark:text-amber-100">Título</h4>
      <p className="text-sm text-amber-800 dark:text-amber-200">Contenido</p>
    </div>
  </div>
</div>

// Error
<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center">
```

---

## Iconos

### Estilo de Iconos

- Usar SVGs de Heroicons (outline style)
- Stroke width: 1.5 para iconos en contenido, 2 para iconos en botones
- Tamaños: `w-4 h-4` (pequeño), `w-5 h-5` (normal), `w-6 h-6` (grande)

### Patrón de Icon Box

```jsx
// Icon box para features
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
  <svg className="w-6 h-6" ...>
</div>

// Icon box pequeño
<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
  <svg className="w-4 h-4" ...>
</div>
```

### Iconos Comunes

```jsx
// Flecha derecha (para CTAs)
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
</svg>

// Flecha izquierda (para back)
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
</svg>

// Spinner
<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
</svg>
```

---

## Animaciones

### Clases de Animación

```css
.animate-fade-up     /* Entrada desde abajo con fade */
.animate-fade-in     /* Solo fade */
.animate-scale-in    /* Scale desde 0.95 */
.animate-subtle-bounce /* Bounce sutil para indicadores */
.animate-shimmer    /* Efecto shimmer con teal */
```

### Delays para Stagger

```jsx
<div className="animate-fade-up">Primero</div>
<div className="animate-fade-up delay-100">Segundo</div>
<div className="animate-fade-up delay-200">Tercero</div>
// Disponibles: delay-100 hasta delay-700
```

### Transiciones

```jsx
// Hover básico
className="transition-colors"

// Hover con múltiples propiedades
className="transition-all duration-200"

// Para tarjetas con lift effect
className="card-hover" // Definido en globals.css
```

---

## Layouts

### Navegación

```jsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
  <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    {/* Logo */}
    {/* Links */}
    {/* CTA */}
  </div>
</nav>
```

### Secciones de Página

```jsx
// Sección con fondo diferente
<section className="py-24 bg-muted/30">
  <div className="max-w-6xl mx-auto px-6">
    {/* Contenido */}
  </div>
</section>

// Sección normal
<section className="py-24">
  <div className="max-w-6xl mx-auto px-6">
    {/* Contenido */}
  </div>
</section>

// Sección con gradiente moderno
<section className="py-24 modern-gradient">
  <div className="max-w-6xl mx-auto px-6">
    {/* Contenido */}
  </div>
</section>
```

### Headers de Sección

```jsx
<div className="text-center max-w-2xl mx-auto mb-16">
  <span className="text-sm font-medium text-primary uppercase tracking-wider">
    Label
  </span>
  <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
    Título de Sección
  </h2>
  <p className="mt-4 text-muted-foreground text-lg">
    Descripción de la sección.
  </p>
</div>
```

### Grids

```jsx
// Grid de 4 columnas (responsive)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

// Grid de 3 columnas
<div className="grid md:grid-cols-3 gap-8">

// Grid de 2 columnas para formularios
<div className="grid grid-cols-2 gap-4">
```

---

## Patrones de UI

### Estado de Selección

```jsx
const [selected, setSelected] = useState(false);

<button
  onClick={() => setSelected(!selected)}
  className={`
    p-5 rounded-xl border-2 transition-all
    ${selected
      ? "border-primary bg-primary/5"
      : "border-border hover:border-primary/30"
    }
  `}
>
```

### Estado de Loading

```jsx
// Página completa
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
      {/* Spinner SVG */}
    </div>
    <p className="text-muted-foreground">Cargando...</p>
  </div>
</div>

// Botón
<Button disabled={isLoading}>
  {isLoading ? (
    <span className="flex items-center gap-2">
      {/* Spinner */}
      Cargando...
    </span>
  ) : (
    "Acción"
  )}
</Button>
```

### Estado Vacío

```jsx
<div className="text-center py-12">
  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
    {/* Icon */}
  </div>
  <h3 className="text-lg font-semibold mb-2">No hay datos</h3>
  <p className="text-muted-foreground">Descripción del estado vacío.</p>
</div>
```

### Divisores

```jsx
// Horizontal simple
<div className="h-px bg-border" />

// Vertical (entre stats)
<div className="w-px h-12 bg-border" />

// Con padding
<div className="pt-4 border-t border-border">
```

---

## Qué NO Hacer

### Evitar

1. **Gradientes púrpuras** - Usar colores sólidos o gradientes teal sutiles
2. **Emojis como iconos principales** - Usar SVGs de Heroicons
3. **Elementos flotantes decorativos** - Mantener diseño limpio
4. **Glassmorphism excesivo** - Solo usar backdrop-blur en navegación
5. **Sombras muy pronunciadas** - Usar shadow-sm o shadow-lg con colores sutiles
6. **Bordes redondeados excesivos** - Usar rounded-xl máximo (no rounded-3xl)
7. **Muchas animaciones simultáneas** - Una o dos animaciones por vista
8. **Colores no alineados con el logo** - Mantener paleta teal/cyan

### Ejemplos de Qué Evitar

```jsx
// MAL - Gradiente púrpura
<div className="bg-gradient-to-r from-violet-500 to-purple-600">

// BIEN - Color sólido primario (teal)
<div className="bg-primary">

// MAL - Emoji como icono
<div className="text-3xl">✈️</div>

// BIEN - SVG icon
<svg className="w-6 h-6" ...>

// MAL - Glassmorphism
<div className="glass backdrop-blur-xl bg-white/10">

// BIEN - Fondo sólido con opacidad
<div className="bg-background/80 backdrop-blur-sm">

// MAL - Colores terracotta (paleta antigua)
<div className="bg-amber-600">

// BIEN - Colores teal (paleta actual)
<div className="bg-primary">
```

---

## Patrones del Canvas

### Layout de 3 Columnas

```jsx
// Container principal del canvas
<div className="h-screen flex flex-col">
  <header className="h-14 border-b border-border px-4 flex items-center">
    {/* Header del canvas */}
  </header>

  <div className="flex-1 flex overflow-hidden">
    {/* Sidebar izquierdo */}
    <aside className="w-[250px] border-r border-border overflow-y-auto">

    {/* Panel central (Timeline) */}
    <main className="flex-1 overflow-y-auto bg-muted/30">

    {/* Panel derecho (Contextual) */}
    <aside className="w-[320px] border-l border-border overflow-y-auto">
  </div>
</div>
```

### Estados de Actividad

Los colores funcionales se mantienen independientes del tema principal:

```jsx
// Confirmado (verde) - MANTENER
<div className="border-l-4 border-green-500 bg-green-50/50">
  <span className="text-green-600">✓</span>
</div>

// Pendiente/AI Suggestion (amarillo) - MANTENER
<div className="border-l-4 border-amber-400 bg-amber-50/50">
  <span className="text-amber-600">⚠</span>
</div>

// Conflicto (rojo) - MANTENER
<div className="border-l-4 border-red-500 bg-red-50/50">
  <span className="text-red-600">✕</span>
</div>

// Bloque vacío (gris)
<div className="border-2 border-dashed border-border bg-muted/20">
  <span className="text-muted-foreground">+</span>
</div>
```

### Activity Card

```jsx
<div className={`
  p-4 rounded-lg border transition-all cursor-pointer
  ${isSelected
    ? "border-primary bg-primary/5 shadow-sm"
    : "border-border bg-card hover:border-primary/30"
  }
`}>
  <div className="flex items-start gap-3">
    {/* Icon por tipo */}
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
      <ActivityIcon type={activity.type} />
    </div>

    {/* Contenido */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{time}</span>
        <StatusBadge status={activity.status} />
      </div>
      <h4 className="font-medium truncate">{activity.title}</h4>
      <p className="text-sm text-muted-foreground truncate">{activity.address}</p>
    </div>
  </div>
</div>
```

### AI Badge

```jsx
// Badge para items sugeridos por AI
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    {/* AI/Sparkle icon */}
  </svg>
  Sugerido
</span>
```

### Panel Derecho - Estados

```jsx
// Estado vacío
<div className="h-full flex flex-col items-center justify-center text-center p-6">
  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
    <svg className="w-8 h-8 text-muted-foreground" />
  </div>
  <p className="text-muted-foreground">
    Selecciona una actividad o bloque vacío
  </p>
</div>

// Estado de carga AI
<div className="h-full flex flex-col items-center justify-center text-center p-6">
  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
    <svg className="w-8 h-8 text-primary animate-pulse" />
  </div>
  <p className="font-medium">AI pensando...</p>
  <p className="text-sm text-muted-foreground mt-1">
    Analizando opciones cercanas
  </p>
</div>
```

### Drag & Drop Indicators

```jsx
// Drop zone activa
<div className="border-2 border-dashed border-primary bg-primary/5 rounded-lg">

// Drop zone con conflicto
<div className="border-2 border-dashed border-destructive bg-destructive/5 rounded-lg">

// Item siendo arrastrado
<div className="opacity-50 shadow-lg scale-105">

// Drag handle
<div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
  <svg className="w-4 h-4" /> {/* Grip icon */}
</div>
```

### Sección de Día

```jsx
<div className="mb-6">
  {/* Header del día */}
  <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm p-4 rounded-t-xl border border-border">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold">Día 1 – Lunes, Enero 15</h3>
        <p className="text-sm text-muted-foreground">Llegada y exploración</p>
      </div>
      <Button variant="outline" size="sm">
        Optimizar
      </Button>
    </div>
  </div>

  {/* Timeline del día */}
  <div className="border border-t-0 border-border rounded-b-xl bg-card p-4 space-y-3">
    {/* Activity cards */}
  </div>
</div>
```

### Time Block Vacío

```jsx
<button className={`
  w-full p-4 rounded-lg border-2 border-dashed transition-all text-left
  ${isHovered
    ? "border-primary bg-primary/5"
    : "border-border bg-muted/20 hover:border-primary/50"
  }
`}>
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
      <Plus className="w-4 h-4 text-muted-foreground" />
    </div>
    <div>
      <p className="text-sm font-medium">15:00 – 19:00</p>
      <p className="text-xs text-muted-foreground">Agregar actividad</p>
    </div>
  </div>
</button>
```

---

## Colores del Mapa (PlaceMap)

Colores de categorías para markers en el mapa:

```typescript
const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  restaurants: "#0D9488",  // Teal (primary)
  attractions: "#0891B2",  // Cyan
  cafes: "#14B8A6",        // Teal-500
  bars: "#7C3AED",         // Purple
  museums: "#1D4ED8",      // Blue
  nature: "#059669",       // Green
}
```

---

## Clases Utilitarias Personalizadas

Definidas en `globals.css`:

```css
/* Gradiente moderno - fondo sutil */
.modern-gradient

/* Badges */
.badge-primary    /* Teal suave */
.badge-success    /* Verde */
.badge-teal       /* Teal */

/* Progress bar con gradiente teal */
.progress-modern

/* Card con hover lift */
.card-hover

/* Tipografía moderna */
.font-modern      /* Inter con letter-spacing negativo */

/* Animación shimmer (teal) */
.animate-shimmer

/* Divisor editorial */
.editorial-divider

/* Underline de acento */
.accent-underline
```

---

## Checklist para Nuevos Features

- [ ] ¿Usa la paleta de colores teal definida?
- [ ] ¿Los títulos usan la fuente Inter?
- [ ] ¿Los botones primarios son teal (#0D9488)?
- [ ] ¿Los iconos son SVGs (no emojis)?
- [ ] ¿Las animaciones son sutiles y con propósito?
- [ ] ¿El espaciado sigue el sistema de 4px?
- [ ] ¿Las tarjetas usan rounded-xl y border-border?
- [ ] ¿Los estados de hover son sutiles?
- [ ] ¿El texto secundario usa text-muted-foreground?
- [ ] ¿El layout respeta max-w-6xl para contenido principal?

### Checklist Adicional para Canvas

- [ ] ¿Los estados de actividad usan los colores funcionales correctos (verde/amarillo/rojo)?
- [ ] ¿Las sugerencias de AI tienen el badge correspondiente?
- [ ] ¿Los bloques vacíos son claramente clickeables?
- [ ] ¿El drag & drop tiene feedback visual adecuado?
- [ ] ¿El panel derecho responde al contexto seleccionado?
