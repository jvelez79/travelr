import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { AdminLink } from "@/components/AdminLink"

// Canvas Mockup Component - Visual representation of the app
function CanvasMockup() {
  return (
    <div className="canvas-mockup animate-fade-up delay-400">
      {/* Browser Frame */}
      <div className="browser-frame">
        <div className="browser-dots">
          <span />
          <span />
          <span />
        </div>
        <div className="browser-url">
          <span className="text-xs text-muted-foreground">travelr.app/trips/costa-rica</span>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="canvas-layout">
        {/* Sidebar */}
        <div className="canvas-sidebar">
          <div className="sidebar-header">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
              CR
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">Costa Rica</div>
              <div className="text-xs text-muted-foreground">7 días · 9 personas</div>
            </div>
          </div>

          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="text-xs text-muted-foreground">Actividades</span>
              <span className="text-sm font-semibold">12</span>
            </div>
            <div className="stat-item">
              <span className="text-xs text-muted-foreground">Confirmadas</span>
              <span className="text-sm font-semibold text-green-600">8</span>
            </div>
          </div>

          <div className="sidebar-days">
            <div className="day-pill active">Día 1</div>
            <div className="day-pill">Día 2</div>
            <div className="day-pill">Día 3</div>
            <div className="day-pill">...</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="canvas-timeline">
          <div className="timeline-header">
            <h4 className="font-semibold text-sm">Día 1 – Llegada a San José</h4>
            <span className="text-xs text-muted-foreground">Domingo, 7 Dic</span>
          </div>

          <div className="timeline-activities">
            <div className="activity-card confirmed">
              <div className="activity-time">14:30</div>
              <div className="activity-content">
                <div className="activity-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Vuelo a SJO</div>
                  <div className="text-xs text-muted-foreground">JetBlue B6 1847</div>
                </div>
                <span className="status-badge confirmed">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="activity-card confirmed">
              <div className="activity-time">18:00</div>
              <div className="activity-content">
                <div className="activity-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Hotel Arenal Springs</div>
                  <div className="text-xs text-muted-foreground">La Fortuna, Alajuela</div>
                </div>
                <span className="status-badge confirmed">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="activity-card suggestion">
              <div className="activity-time">20:00</div>
              <div className="activity-content">
                <div className="activity-icon suggestion">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Cena en Restaurante Nene&apos;s</div>
                  <div className="text-xs text-muted-foreground">Cocina típica costarricense</div>
                </div>
                <span className="status-badge ai">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <div className="canvas-ai-panel">
          <div className="ai-panel-header">
            <div className="ai-icon">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="font-medium text-sm">Sugerencias AI</span>
          </div>

          <div className="ai-suggestions">
            <div className="ai-suggestion-card">
              <div className="suggestion-icon">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium">Volcán Arenal</div>
                <div className="text-[10px] text-muted-foreground">A 15 min del hotel</div>
              </div>
            </div>

            <div className="ai-suggestion-card">
              <div className="suggestion-icon">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium">Tabacón Hot Springs</div>
                <div className="text-[10px] text-muted-foreground">Popular en la zona</div>
              </div>
            </div>

            <div className="ai-suggestion-card">
              <div className="suggestion-icon">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium">Sky Adventures</div>
                <div className="text-[10px] text-muted-foreground">Zip line + puentes</div>
              </div>
            </div>
          </div>

          <button className="ai-generate-btn">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Generar más ideas
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo href="/" size="md" />

          <div className="flex items-center gap-6">
            <AdminLink variant="text" />
            <Link
              href="/trips"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mis Viajes
            </Link>
            <Link href="/trips/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Comenzar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section className="flex-1 flex items-center pt-16 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 modern-gradient" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium badge-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Planificación inteligente con AI
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] animate-fade-up delay-100">
              Deja de planificar.
              <br />
              <span className="text-primary">Empieza a viajar.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
              Tu viaje entero en una pantalla. Google Places rellena todo automáticamente.
              AI que entiende tu estilo de viaje.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
              <Link href="/trips/new">
                <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                  Crear mi viaje
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="ghost" className="h-12 px-8 text-base text-muted-foreground hover:text-foreground">
                  Ver cómo funciona
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </Button>
              </Link>
            </div>

            {/* Canvas Mockup */}
            <CanvasMockup />

            {/* Trust Signals */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground animate-fade-up delay-500">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                En minutos, no semanas
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Google Places integrado
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                3 AI Agents especializados
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-border/50 bg-background/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo href="/" size="sm" />
            <p className="text-sm text-muted-foreground">
              Planifica viajes de forma inteligente
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/trips" className="hover:text-foreground transition-colors">Mis Viajes</Link>
              <Link href="/trips/new" className="hover:text-foreground transition-colors">Nuevo Viaje</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
