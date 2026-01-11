import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { AdminLink } from "@/components/AdminLink"

// Product Canvas Mockup - Shows actual canvas structure
function ProductCanvasMockup() {
  return (
    <div className="product-mockup-container">
      {/* Glow effect behind the mockup */}
      <div className="product-mockup-glow" />

      <div className="product-mockup">
        {/* Browser chrome */}
        <div className="mockup-browser-bar">
          <div className="browser-dots">
            <span /><span /><span />
          </div>
          <div className="mockup-url-bar">
            <svg className="w-3 h-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-muted-foreground/70">travelr.vercel.app/canvas</span>
          </div>
        </div>

        {/* Canvas 3-column layout */}
        <div className="mockup-canvas-layout">
          {/* Left sidebar - Trip overview */}
          <div className="mockup-sidebar">
            <div className="mockup-sidebar-header">
              <div className="mockup-avatar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium">Costa Rica</div>
                <div className="text-[10px] text-muted-foreground">7 dias</div>
              </div>
            </div>
            <div className="mockup-day-pills">
              <span className="mockup-day-pill active">D1</span>
              <span className="mockup-day-pill">D2</span>
              <span className="mockup-day-pill">D3</span>
              <span className="mockup-day-pill">D4</span>
            </div>
          </div>

          {/* Central - Timeline */}
          <div className="mockup-timeline">
            <div className="mockup-timeline-header">
              <span className="text-xs font-medium">Dia 1 - San Jose</span>
              <span className="text-[10px] text-primary">+ Agregar</span>
            </div>

            {/* Activity cards */}
            <div className="mockup-activity confirmed">
              <div className="mockup-activity-time">9:00</div>
              <div className="mockup-activity-icon teal">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="mockup-activity-content">
                <div className="text-xs font-medium">Llegada Aeropuerto SJO</div>
                <div className="text-[10px] text-muted-foreground">Juan Santamaria Intl</div>
              </div>
              <div className="mockup-status-badge confirmed">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="mockup-activity suggestion">
              <div className="mockup-activity-time">12:00</div>
              <div className="mockup-activity-icon amber">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="mockup-activity-content">
                <div className="text-xs font-medium">Mercado Central</div>
                <div className="text-[10px] text-muted-foreground">Sugerencia AI</div>
              </div>
              <div className="mockup-status-badge ai">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            <div className="mockup-activity">
              <div className="mockup-activity-time">15:00</div>
              <div className="mockup-activity-icon teal">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="mockup-activity-content">
                <div className="text-xs font-medium">Check-in Hotel</div>
                <div className="text-[10px] text-muted-foreground">Hotel Presidente</div>
              </div>
            </div>
          </div>

          {/* Right panel - AI */}
          <div className="mockup-ai-panel">
            <div className="mockup-ai-header">
              <div className="mockup-ai-icon">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-[10px] font-medium">AI Curator</span>
            </div>
            <div className="mockup-ai-suggestion">
              <div className="text-[10px] font-medium text-primary">Restaurante recomendado</div>
              <div className="text-[9px] text-muted-foreground">Cerca de tu hotel, cocina local</div>
            </div>
            <div className="mockup-ai-suggestion">
              <div className="text-[10px] font-medium text-primary">Optimizar ruta</div>
              <div className="text-[9px] text-muted-foreground">Ahorra 25 min de transporte</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Social Proof Component
function SocialProof() {
  return (
    <div className="social-proof-enhanced animate-fade-up opacity-0" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
      <div className="avatar-stack-enhanced">
        <div className="avatar-item-enhanced" style={{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
        <div className="avatar-item-enhanced" style={{ backgroundImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} />
        <div className="avatar-item-enhanced" style={{ backgroundImage: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }} />
        <div className="avatar-item-enhanced" style={{ backgroundImage: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }} />
      </div>
      <div className="social-proof-text-enhanced">
        <span className="social-proof-number">500+</span>
        <span className="social-proof-label">viajeros planificando con Travelr</span>
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
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              Mis Viajes
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/trips/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 transition-all duration-200">
                Comenzar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Minimal, Linear-style */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-16 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 hero-gradient" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 hero-grid opacity-[0.02]" />

        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb floating-orb-1" />
          <div className="floating-orb floating-orb-2" />
          <div className="floating-orb floating-orb-3" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
          {/* Main Headline - Larger, more impact */}
          <h1 className="hero-title">
            <span className="block animate-fade-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              Deja de planificar.
            </span>
            <span className="block hero-title-gradient" style={{ animationDelay: '150ms' }}>
              Empieza a viajar.
            </span>
          </h1>

          {/* Improved value proposition - more specific */}
          <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            Arrastra destinos, reorganiza dias, ve todo tu itinerario de un vistazo.
            <span className="block mt-1 text-foreground/80">La AI completa los detalles con datos reales de Google Places.</span>
          </p>

          {/* Single prominent CTA */}
          <div className="mt-10 animate-fade-up opacity-0" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
            <Link href="/trips/new">
              <Button size="lg" className="hero-cta group">
                Empieza gratis
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sin tarjeta de credito
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Gratis para siempre
              </span>
            </div>
          </div>

          {/* Social Proof */}
          <SocialProof />

          {/* Product Canvas Mockup - Shows real product */}
          <div className="mt-16 animate-fade-up opacity-0" style={{ animationDelay: '650ms', animationFillMode: 'forwards' }}>
            <ProductCanvasMockup />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-up opacity-0" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
          <Link href="#features" className="scroll-indicator group">
            <span className="text-sm font-medium">Descubre más</span>
            <div className="scroll-indicator-arrow">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* Features Section - Below the fold */}
      <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 features-gradient opacity-50" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              Funcionalidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Todo lo que necesitas para planificar
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Herramientas inteligentes que hacen el trabajo por ti.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card group">
              <div className="feature-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">En minutos, no semanas</h3>
              <p className="mt-2 text-muted-foreground">
                Genera itinerarios completos en segundos. La AI hace el trabajo pesado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card group">
              <div className="feature-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Google Places integrado</h3>
              <p className="mt-2 text-muted-foreground">
                Información real de restaurantes, hoteles y atracciones. Sin inventar datos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card group">
              <div className="feature-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">3 AI Agents especializados</h3>
              <p className="mt-2 text-muted-foreground">
                Architect, Curator y Optimizer trabajan juntos para crear tu viaje perfecto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 border-t border-border/50">
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
