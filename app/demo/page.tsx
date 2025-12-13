import { Metadata } from "next"
import HomePageClient from "../components/HomePageClient"

export const metadata: Metadata = {
  title: "Demo - Colibrí-REST",
  description: "Prueba el sistema completo de gestión para restaurantes en vivo.",
}

export default function DemoPage() {
  return <HomePageClient />
}
