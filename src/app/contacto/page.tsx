'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import Layout from '@/components/Layout';

export default function ContactoPage() {
  const cards = [
    {
      href: 'https://wa.me/56920265061',
      label: 'WhatsApp',
      description: 'Chatea con nosotros directamente',
      value: '+56 9 2026 5061',
      icon: <MessageCircle className="w-6 h-6 text-emerald-500" />,
      accent: 'from-emerald-100 to-teal-50'
    },
    {
      href: 'mailto:contacto@huntercardtcg.com',
      label: 'Email',
      description: 'Envíanos un correo electrónico',
      value: 'contacto@huntercardtcg.com',
      icon: <Mail className="w-6 h-6 text-amber-500" />,
      accent: 'from-amber-100 to-orange-50'
    },
    {
      href: 'tel:+56920265061',
      label: 'Teléfono',
      description: 'Llámanos durante horario comercial',
      value: '+56 9 2026 5061',
      icon: <Phone className="w-6 h-6 text-rose-500" />,
      accent: 'from-rose-100 to-pink-50'
    }
  ];

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900">
              Contáctanos
            </h1>
            <p className="text-lg text-slate-500">
              Estamos aquí para ayudarte. Escríbenos por el canal que prefieras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {cards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.href.startsWith('http') ? '_blank' : undefined}
                rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.65)] transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent}`}>
                    {card.icon}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-900">{card.label}</h3>
                    <p className="text-slate-500">{card.description}</p>
                    <p className="text-slate-900 font-semibold">{card.value}</p>
                  </div>
                </div>
              </a>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.65)]">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-50">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </span>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-900">Nuestras Sucursales</h3>
                  {[
                    { name: 'Santiago Centro', location: 'Santiago, Chile' },
                    { name: 'Las Condes', location: 'Santiago, Chile' }
                  ].map((branch) => (
                    <div key={branch.name}>
                      <p className="font-semibold text-slate-900">{branch.name}</p>
                      <p className="text-sm text-slate-500">{branch.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_25px_70px_-50px_rgba(15,23,42,0.65)] mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Horario de Atención</h2>
            <div className="space-y-1 text-slate-600">
              <p>Lunes a Viernes: 9:00 - 18:00</p>
              <p>Sábado: 10:00 - 14:00</p>
              <p>Domingo: Cerrado</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-10 py-3 text-base font-semibold text-white shadow-lg hover:from-amber-300 hover:to-rose-300"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
