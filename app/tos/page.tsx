import Link from "next/link"

export const metadata = {
  title: "Términos de Servicio | Sonora Express",
  description: "Términos y condiciones de uso de Sonora Express",
}

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-amber-700">Términos de Servicio</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <p className="mb-4 text-sm text-gray-500">Última actualización: 8 de mayo de 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">1. Aceptación de los Términos</h2>
          <p className="mb-3 text-gray-700">
            Al acceder y utilizar los servicios de Sonora Express, ya sea a través de nuestro sitio web, aplicación
            móvil o al realizar pedidos por teléfono o WhatsApp, usted acepta estar sujeto a estos Términos de Servicio.
            Si no está de acuerdo con alguna parte de estos términos, no podrá acceder a nuestros servicios.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">2. Descripción del Servicio</h2>
          <p className="mb-3 text-gray-700">
            Sonora Express ofrece servicios de restaurante, incluyendo la venta de alimentos y bebidas para consumo en
            el local, para llevar y entrega a domicilio. Nuestros servicios incluyen la posibilidad de realizar pedidos
            a través de nuestra plataforma en línea, por teléfono o mediante servicios de mensajería como WhatsApp.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">3. Cuentas de Usuario</h2>
          <p className="mb-3 text-gray-700">
            Para utilizar ciertas funciones de nuestro servicio, puede ser necesario crear una cuenta. Usted es
            responsable de mantener la confidencialidad de su cuenta y contraseña, así como de restringir el acceso a su
            computadora o dispositivo móvil. Acepta asumir la responsabilidad de todas las actividades que ocurran bajo
            su cuenta.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">4. Pedidos y Pagos</h2>
          <p className="mb-3 text-gray-700">
            Al realizar un pedido a través de nuestros servicios, usted confirma que la información proporcionada es
            precisa y completa. Nos reservamos el derecho de rechazar o cancelar cualquier pedido por cualquier motivo,
            incluyendo errores en la descripción o precio de los productos, o problemas identificados por nuestro
            departamento de seguridad.
          </p>
          <p className="mb-3 text-gray-700">
            Los precios de los productos están sujetos a cambios sin previo aviso. Todos los pagos se procesarán de
            manera segura a través de nuestros proveedores de servicios de pago.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">5. Entrega</h2>
          <p className="mb-3 text-gray-700">
            Los tiempos de entrega son estimados y pueden variar dependiendo de factores como el tráfico, el clima y la
            demanda. Haremos todo lo posible para entregar su pedido dentro del tiempo estimado. Para garantizar una
            entrega exitosa, asegúrese de proporcionar una dirección de entrega precisa y completa.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">6. Política de Cancelación</h2>
          <p className="mb-3 text-gray-700">
            Los pedidos pueden ser cancelados sin cargo antes de que comience la preparación. Una vez que el pedido está
            en preparación, se aplicarán cargos por cancelación. Los pedidos que ya han sido enviados para entrega no
            pueden ser cancelados.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">7. Propiedad Intelectual</h2>
          <p className="mb-3 text-gray-700">
            Todo el contenido incluido en nuestro sitio web y aplicación, como texto, gráficos, logotipos, imágenes,
            clips de audio, descargas digitales y compilaciones de datos, es propiedad de Sonora Express o de sus
            proveedores de contenido y está protegido por las leyes de propiedad intelectual.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">8. Limitación de Responsabilidad</h2>
          <p className="mb-3 text-gray-700">
            Sonora Express no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente que
            resulte del uso o la imposibilidad de usar nuestros servicios, o de cualquier información, productos o
            servicios obtenidos a través de nuestros servicios.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">9. Ley Aplicable</h2>
          <p className="mb-3 text-gray-700">
            Estos Términos de Servicio se regirán e interpretarán de acuerdo con las leyes de México, sin dar efecto a
            ningún principio de conflicto de leyes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">10. Cambios en los Términos</h2>
          <p className="mb-3 text-gray-700">
            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier
            momento. Si una revisión es material, proporcionaremos al menos 30 días de aviso antes de que los nuevos
            términos entren en vigencia. Lo que constituye un cambio material será determinado a nuestra sola
            discreción.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">11. Contacto</h2>
          <p className="mb-3 text-gray-700">
            Si tiene alguna pregunta sobre estos Términos, por favor contáctenos a través de nuestro sitio web o
            enviando un correo electrónico a info@sonoraexpress.com.
          </p>
        </section>
      </div>

      <div className="text-center mt-8 mb-12">
        <Link href="/" className="text-amber-600 hover:text-amber-800 font-medium">
          Volver a la página principal
        </Link>
      </div>
    </div>
  )
}
