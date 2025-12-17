import { AuthLayout, LoginForm } from '@/components/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Travelr',
  description: 'Inicia sesión en tu cuenta de Travelr para planificar tus viajes',
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
    >
      <LoginForm />
    </AuthLayout>
  )
}
