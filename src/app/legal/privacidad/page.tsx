import Link from 'next/link';
import Layout from '@/components/Layout';

export default function PrivacidadPage() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)]">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8">
              Política de Privacidad
            </h1>

            <div className="space-y-6 text-slate-600">
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  1. Información que Recopilamos
                </h2>
                <p>
                  En GAMERHOUSE recopilamos información personal necesaria para procesar tus pedidos,
                  incluyendo nombre, email, teléfono, RUT y dirección de entrega.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  2. Uso de la Información
                </h2>
                <p>Utilizamos tu información personal para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Procesar y gestionar tus pedidos</li>
                  <li>Comunicarnos contigo sobre el estado de tus compras</li>
                  <li>Mejorar nuestros servicios y productos</li>
                  <li>Enviar información relevante sobre ofertas (solo si lo autorizas)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  3. Protección de Datos
                </h2>
                <p>
                  Implementamos medidas de seguridad para proteger tu información personal contra
                  accesos no autorizados, alteración, divulgación o destrucción.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  4. Compartir Información
                </h2>
                <p>
                  No vendemos ni compartimos tu información personal con terceros, excepto cuando
                  sea necesario para procesar pagos o realizar envíos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  5. Cookies
                </h2>
                <p>
                  Utilizamos cookies para mejorar tu experiencia de navegación y mantener tu
                  carrito de compras activo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  6. Tus Derechos
                </h2>
                <p>
                  Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier
                  momento contactándonos a través de nuestros canales de atención.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  7. Contacto
                </h2>
                <p>
                  Para cualquier consulta sobre privacidad, contáctanos en{' '}
                  <a href="mailto:contacto@GAMERHOUSE.cl" className="text-amber-600 hover:text-amber-500">
                    contacto@GAMERHOUSE.cl
                  </a>
                </p>
              </section>

              <p className="text-sm text-slate-400 mt-8">
                Última actualización: {new Date().toLocaleDateString('es-CL')}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t">
              <Link
                href="/"
                className="inline-flex items-center justify-center py-3 px-8 rounded-full text-base font-semibold text-white bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
