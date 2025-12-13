import { Suspense } from 'react'
import ThankYouClient from './thank-you-client'

interface ThankYouPageProps {
  searchParams: Promise<{
    orderId?: string
    payment?: string 
    status?: string
  }>
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams
  console.log('🚀 Server Component - searchParams recibidos:', params)
  
  return (
    <Suspense fallback={<ThankYouLoading />}>
      <ThankYouClient 
        orderId={params.orderId}
        paymentMethod={params.payment}
        status={params.status}
      />
    </Suspense>
  )
}

function ThankYouLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-colibri-gold mx-auto mb-4"></div>
        <p className="text-colibri-beige text-lg">Preparando tu confirmación...</p>
      </div>
    </div>
  )
}