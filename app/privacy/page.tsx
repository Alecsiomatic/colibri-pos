import Link from "next/link"

export const metadata = {
  title: "Política de Privacidad | Sonora Express",
  description: "Política de privacidad y protección de datos de Sonora Express",
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-amber-700">Política de Privacidad</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <p className="mb-4 text-sm text-gray-500">Última actualización: 8 de mayo de 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">1. Introducción</h2>
          <p className="mb-3 text-gray-700">
            En Sonora Express, respetamos su privacidad y nos comprometemos a proteger sus datos personales. Esta
            Política de Privacidad describe cómo recopilamos, utilizamos y compartimos su información cuando utiliza
            nuestros servicios, ya sea a través de nuestro sitio web, aplicación móvil, o al realizar pedidos por
            teléfono o WhatsApp.
          </p>
          <p className="mb-3 text-gray-700">
            Al utilizar nuestros servicios, usted acepta las prácticas descritas en esta Política de Privacidad. Si no
            está de acuerdo con esta política, por favor no utilice nuestros servicios.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">2. Información que Recopilamos</h2>
          <p className="mb-3 text-gray-700">Podemos recopilar los siguientes tipos de información:</p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li className="mb-2">
              Información personal: nombre, dirección de correo electrónico, número de teléfono, dirección de entrega.
            </li>
            <li className="mb-2">
              Información de pago: detalles de tarjetas de crédito o débito, información de facturación.
            </li>
            <li className="mb-2">Información de la cuenta: nombre de usuario, contraseña, preferencias de cuenta.</li>
            <li className="mb-2">
              Información de uso: cómo utiliza nuestro sitio web y aplicación, qué páginas visita, qué productos ve.
            </li>
            <li className="mb-2">Información del dispositivo: tipo de dispositivo, sistema operativo, dirección IP.</li>
            <li className="mb-2">
              Comunicaciones: mensajes que nos envía a través de formularios de contacto, correo electrónico o servicios
              de mensajería como WhatsApp.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">3. Cómo Utilizamos su Información</h2>
          <p className="mb-3 text-gray-700">Utilizamos la información que recopilamos para:</p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li className="mb-2">Procesar y entregar sus pedidos.</li>
            <li className="mb-2">Gestionar su cuenta y proporcionarle soporte al cliente.</li>
            <li className="mb-2">Mejorar nuestros productos y servicios.</li>
            <li className="mb-2">Personalizar su experiencia y proporcionarle contenido y ofertas relevantes.</li>
            <li className="mb-2">Comunicarnos con usted sobre actualizaciones, promociones y eventos.</li>
            <li className="mb-2">Proteger nuestros servicios y prevenir actividades fraudulentas.</li>
            <li className="mb-2">Cumplir con nuestras obligaciones legales.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">4. Compartir su Información</h2>
          <p className="mb-3 text-gray-700">Podemos compartir su información con:</p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li className="mb-2">
              Proveedores de servicios que nos ayudan a operar nuestro negocio, como procesadores de pagos, servicios de
              entrega y proveedores de servicios de TI.
            </li>
            <li className="mb-2">Socios comerciales con los que ofrecemos productos o servicios conjuntos.</li>
            <li className="mb-2">
              Autoridades legales cuando sea requerido por ley o para proteger nuestros derechos legales.
            </li>
          </ul>
          <p className="mb-3 text-gray-700">No vendemos su información personal a terceros.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">5. Seguridad de los Datos</h2>
          <p className="mb-3 text-gray-700">
            Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos personales
            contra el acceso no autorizado, la divulgación, la alteración y la destrucción. Sin embargo, ningún sistema
            de seguridad es impenetrable y no podemos garantizar la seguridad absoluta de su información.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">6. Sus Derechos</h2>
          <p className="mb-3 text-gray-700">
            Dependiendo de su ubicación, puede tener ciertos derechos con respecto a sus datos personales, incluyendo:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li className="mb-2">Acceder a sus datos personales.</li>
            <li className="mb-2">Corregir datos inexactos o incompletos.</li>
            <li className="mb-2">Eliminar sus datos personales.</li>
            <li className="mb-2">Restringir u oponerse al procesamiento de sus datos.</li>
            <li className="mb-2">Recibir sus datos en un formato estructurado y transferirlos a otro controlador.</li>
            <li className="mb-2">Retirar su consentimiento en cualquier momento.</li>
          </ul>
          <p className="mb-3 text-gray-700">
            Para ejercer estos derechos, por favor contáctenos utilizando la información proporcionada al final de esta
            política.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">7. Cookies y Tecnologías Similares</h2>
          <p className="mb-3 text-gray-700">
            Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestro sitio web, recordar sus
            preferencias y entender cómo los usuarios interactúan con nuestro sitio. Puede configurar su navegador para
            rechazar todas las cookies o para indicar cuándo se está enviando una cookie. Sin embargo, algunas funciones
            de nuestro sitio pueden no funcionar correctamente sin cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">8. Privacidad de los Niños</h2>
          <p className="mb-3 text-gray-700">
            Nuestros servicios no están dirigidos a personas menores de 18 años. No recopilamos a sabiendas información
            personal de niños menores de 18 años. Si descubrimos que hemos recopilado información personal de un niño
            menor de 18 años, eliminaremos esa información lo más rápido posible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">9. Cambios a esta Política</h2>
          <p className="mb-3 text-gray-700">
            Podemos actualizar esta Política de Privacidad de vez en cuando. La versión más reciente estará siempre
            disponible en nuestro sitio web. Le recomendamos que revise periódicamente esta política para estar
            informado sobre cómo protegemos su información.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">10. Contacto</h2>
          <p className="mb-3 text-gray-700">
            Si tiene alguna pregunta sobre esta Política de Privacidad o sobre cómo manejamos sus datos personales, por
            favor contáctenos a:
          </p>
          <p className="mb-3 text-gray-700">
            Sonora Express
            <br />
            Correo electrónico: privacy@sonoraexpress.com
            <br />
            Teléfono: (123) 456-7890
            <br />
            Dirección: Calle Principal #123, Ciudad, Estado, México
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
