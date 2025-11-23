import Link from 'next/link';
import Layout from '@/components/Layout';

export default function TerminosPage() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.35)]">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8">
              Términos y Condiciones
            </h1>

            <div className="space-y-6 text-slate-600">
              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  1. Aceptación de Términos
                </h2>
                <p>
                  Al utilizar nuestro sitio web y realizar compras en GAMERHOUSE, aceptas
                  estos términos y condiciones en su totalidad.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  2. Productos y Precios
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los precios están expresados en pesos chilenos (CLP)</li>
                  <li>Los precios pueden cambiar sin previo aviso</li>
                  <li>Las imágenes son referenciales</li>
                  <li>Nos reservamos el derecho de limitar cantidades</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  3. Proceso de Compra
                </h2>
                <p>
                  Al realizar un pedido, recibirás una confirmación por email. La aceptación
                  final del pedido está sujeta a disponibilidad de stock y verificación de pago.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  4. Métodos de Pago
                </h2>
                <p>Aceptamos los siguientes métodos de pago:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transferencia bancaria</li>
                  <li>MercadoPago (tarjetas de crédito/débito)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  5. Envíos y Entregas
                </h2>
                <p>
                  Los tiempos de entrega son estimados y pueden variar según la ubicación.
                  Los costos de envío se calculan según la dirección de entrega.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  6. Devoluciones y Cambios
                </h2>
                <p>
                  Aceptamos devoluciones y cambios dentro de los 7 días posteriores a la recepción,
                  siempre que el producto esté en su empaque original y sin uso.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  7. Garantía
                </h2>
                <p>
                  Los productos cuentan con garantía según lo establecido por la ley del consumidor
                  chilena y las especificaciones del fabricante.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  8. Responsabilidad
                </h2>
                <p>
                  No nos hacemos responsables por daños indirectos o consecuentes derivados del
                  uso de nuestros productos o servicios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  9. Modificaciones
                </h2>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento.
                  Los cambios entrarán en vigencia inmediatamente después de su publicación.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  10. Contacto
                </h2>
                <p>
                  Para consultas sobre estos términos:{' '}
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
