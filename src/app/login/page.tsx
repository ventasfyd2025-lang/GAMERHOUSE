'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserAuth } from '@/hooks/useUserAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useUserAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/');
    } catch (error) {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-primary/80">
            Accede a tu cuenta para continuar
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-dark/80 py-8 px-4 shadow-lg shadow-red-600/20 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-darklight border border-dark-light text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-primary/40 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-primary/40 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-primary/50" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-primary/50" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          {/* Google Sign-In */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/40" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark/80 text-primary/60">O continúa con</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton
                mode="signin"
                onSuccess={() => router.push('/')}
                onError={(error) => setError(error)}
                size="md"
                variant="outline"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/40" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark/80 text-primary/60">¿No tienes cuenta?</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/registro"
                className="w-full flex justify-center py-2 px-4 border border-primary rounded-md shadow-sm bg-dark/80 text-sm font-medium text-primary hover:bg-darklight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Crear Nueva Cuenta
              </Link>
              
              <Link
                href="/checkout?guest=true"
                className="w-full flex justify-center py-2 px-4 text-sm font-medium text-primary/80 hover:text-white"
              >
                Continuar como invitado
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary hover:text-primary font-medium">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}