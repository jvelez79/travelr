import { AuthLayout, SignUpForm } from '@/components/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear Cuenta | Travelr',
  description: 'Crea tu cuenta en Travelr y empieza a planificar tus viajes con IA',
}

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Ingresa tus datos para crear una cuenta nueva"
    >
      <SignUpForm />
    </AuthLayout>
  )
}
