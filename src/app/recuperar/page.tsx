'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserAuth } from '@/hooks/useUserAuth';

export default function RecuperarClavePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { resetPassword } = useUserAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setMessage('Ingresa tu correo');
      setStatus('error');
      return;
    }
    try {
      setStatus('loading');
      await resetPassword(email);
      setMessage('Te enviamos un correo con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.');
      setStatus('success');
    } catch (error) {
      setMessage('No pudimos enviar el correo. Verifica el email o intenta nuevamente.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Recuperar contraseña</h2>
          <p className="text-sm text-slate-500">Ingresa tu correo para enviarte el enlace de restablecimiento</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.8)] border border-slate-100 rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {status !== 'idle' && (
              <div className={`${status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'} px-4 py-3 rounded-xl border`}>
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-600">Correo electrónico</label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="text-amber-500 hover:text-amber-600 font-semibold">← Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
