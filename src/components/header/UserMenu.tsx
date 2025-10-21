'use client';

import { memo } from 'react';
import Link from 'next/link';
import { User, ShoppingBag, LogOut } from 'lucide-react';

interface UserMenuProps {
  isOpen: boolean;
  isRegistered: boolean;
  isGuest: boolean;
  userMenuRef: React.RefObject<HTMLDivElement>;
  onLogout: () => void;
}

const UserMenu = memo(function UserMenu({
  isOpen,
  isRegistered,
  isGuest,
  userMenuRef,
  onLogout
}: UserMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      ref={userMenuRef}
      className="absolute right-0 mt-2 w-52 bg-brand-neutral-dark/80 rounded-xl shadow-2xl py-2 z-50 border border-brand-primary100"
    >
      {isRegistered && (
        <>
          <Link
            href="/perfil"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-brand-neutral-light hover:text-brand-primary600 transition-colors"
          >
            <User className="w-5 h-5 mr-3 text-brand-primary500" strokeWidth={2.5} />
            Mi Perfil
          </Link>
          <Link
            href="/mis-pedidos"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-brand-neutral-light hover:text-brand-primary600 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 mr-3 text-brand-primary500" strokeWidth={2.5} />
            Mis Pedidos
          </Link>
        </>
      )}

      {isGuest && (
        <>
          <Link
            href="/login"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-brand-neutral-light hover:text-brand-primary600 transition-colors"
          >
            <User className="w-5 h-5 mr-3 text-brand-primary500" strokeWidth={2.5} />
            Iniciar Sesión
          </Link>
          <Link
            href="/registro"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-brand-neutral-light hover:text-brand-primary600 transition-colors"
          >
            Registrarse
          </Link>
        </>
      )}

      {!isGuest && (
        <button
          onClick={onLogout}
          className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-cyber-pink hover:bg-brand-neutral-light transition-colors border-t border-gray-100 mt-1"
        >
          <LogOut className="w-5 h-5 mr-3" strokeWidth={2.5} />
          Cerrar Sesión
        </button>
      )}
    </div>
  );
});

export default UserMenu;
