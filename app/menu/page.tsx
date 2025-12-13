import MenuPageClient from "./MenuPageClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menú | Colibrí-REST",
  description: "Explora nuestro menú de hamburguesas, alitas y más con los mejores sabores",
}

export default function MenuPage() {
  return <MenuPageClient />
}
