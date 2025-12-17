"use client"

import { Logo } from "@/components/Logo"
import { Sparkles } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Card contenedor */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header unificado: Logo + Tagline + Título */}
          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" />
            <p className="text-muted-foreground mt-1 text-sm">
              Tu asistente de viajes con IA
            </p>

            {/* Título de la página */}
            <h2 className="text-2xl font-bold text-foreground mt-6">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          </div>

          {/* Form slot */}
          {children}
        </div>
      </div>

      {/* Decoración adicional sutil */}
      <div className="absolute top-1/4 left-10 opacity-20">
        <div className="w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      </div>
      <div className="absolute bottom-1/4 right-20 opacity-20">
        <div className="w-48 h-48 rounded-full bg-white/10 blur-3xl" />
      </div>
    </div>
  )
}
