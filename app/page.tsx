import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Colibrí-REST - Sistema para Restaurantes",
  description: "Sistema completo de gestión para restaurantes: pedidos, mesas, delivery, kiosko y más. Demo en vivo.",
}

export default function HomePage() {
  // Redirigir al landing
  redirect("/landing")
}