import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-800 to-slate-800">
      <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/80 rounded-xl shadow-lg shadow-red-600/20 border border-yellow-300/30 p-8">
            <h1 className="text-3xl font-bold text-white mb-6">
              Política de Privacidad
            </h1>

            <div className="prose prose-orange max-w-none space-y-6 text-yellow-300">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">
                  1. Información que Recopilamos
                </h2>
                <p>
                  En GAMERHOUSE recopilamos información personal necesaria para procesar tus pedidos,
                  incluyendo nombre, email, teléfono, RUT y dirección de entrega.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">
                  2. Uso de la Información
                </h2>
                <p>
                  Utilizamos tu información personal para:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Procesar y gestionar tus pedidos</li>
                  <li>Comunicarnos contigo sobre el estado de tus compras</li>
                  <li>Mejorar nuestros servicios y productos</li>
                  <li>Enviar información relevante sobre ofertas (solo si lo autorizas)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">
                  3. Protección de Datos
                </h2>
                <p>
                  Implementamos medidas de seguridad para proteger tu información personal contra
                  accesos no autorizados, alteración, divulgación o destrucción.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">
                  4. Compartir Información
                </h2>
                <p>
                  No vendemos ni compartimos tu información personal con terceros, excepto cuando
                  sea necesario para procesar pagos o realizar envíos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">
                  5. Cookies
                </h2>
                <p>
                  Utilizamos cookies para mejorar tu experiencia de navegación y mantener tu
                  carrito de compras activo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">
                  6. Tus Derechos
                </h2>
                <p>
                  Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier
                  momento contactándonos a través de nuestros canales de atención.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">
                  7. Contacto
                </h2>
                <p>
                  Para cualquier consulta sobre privacidad, contáctanos en:{' '}
                  <a href="mailto:contacto@GAMERHOUSE.cl" className="text-yellow-300 hover:text-yellow-300-hover">
                    contacto@GAMERHOUSE.cl
                  </a>
                </p>
              </section>

              <p className="text-sm text-yellow-300/60 mt-8">
                Última actualización: {new Date().toLocaleDateString('es-CL')}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t">
              <Link
                href="/"
                className="inline-flex items-center justify-center py-2 px-6 border border-transparent rounded-lg text-base font-medium text-white bg-yellow-400 hover:bg-yellow-400-hover transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
