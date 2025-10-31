'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useUserAuth } from '@/hooks/useUserAuth';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/hooks/useUserAuth';

export default function UsuariosAdminPage() {
  const { isAdmin, userProfile, currentUser, loading: authLoading } = useUserAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // Protección de ruta: redirigir si no es administrador
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || !isAdmin) {
        console.warn('⚠️ Acceso denegado a /admin/usuarios: usuario no es administrador');
        router.push('/');
      }
    }
  }, [authLoading, currentUser, isAdmin, router]);

  useEffect(() => {
    if (currentUser && isAdmin) {
      loadUsers();
    }
  }, [currentUser, isAdmin]);

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <Layout>
        <div
          id="admin-container"
          className="flex min-h-screen items-center justify-center text-white"
          style={{ background: 'var(--brand-background)' }}
        >
          <div className="card-dark text-center text-xl">Cargando...</div>
        </div>
      </Layout>
    );
  }

  // Bloquear acceso si no es admin
  if (!currentUser || !isAdmin) {
    return (
      <Layout>
        <div
          id="admin-container"
          className="flex min-h-screen items-center justify-center px-4 py-12 text-white"
          style={{ background: 'var(--brand-background)' }}
        >
          <div className="hero-section w-full max-w-lg overflow-hidden">
            <div className="hero-bg opacity-80" />
            <div className="relative space-y-5 px-8 py-10 text-center">
              <div className="text-4xl">🔒</div>
              <h2 className="text-2xl font-bold text-white">Acceso restringido</h2>
              <p className="text-sm text-white/70">
                Solo los administradores pueden gestionar usuarios. Solicita permisos o regresa al panel principal.
              </p>
              <button
                onClick={() => router.push('/admin')}
                className="btn-secondary-web w-full justify-center text-sm sm:w-auto"
              >
                Volver al panel
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const loadUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'vendedor' | 'cliente') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      // Actualizar estado local
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, role: newRole } : user
      ));

      setEditingUser(null);
      alert('Rol actualizado exitosamente');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar rol');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(user => user.uid !== userId));
      alert('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'border-yellow-300/60 bg-yellow-300/15 text-yellow-100 shadow-[0_0_12px_rgba(255,232,141,0.25)]';
      case 'vendedor':
        return 'border-orange-400/50 bg-orange-500/15 text-orange-200 shadow-[0_0_12px_rgba(255,181,99,0.25)]';
      case 'cliente':
        return 'border-blue-400/40 bg-blue-500/15 text-blue-200';
      default:
        return 'border-white/20 bg-white/5 text-white/80';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div
          id="admin-container"
          className="flex min-h-screen items-center justify-center text-white"
          style={{ background: 'var(--brand-background)' }}
        >
          <div className="card-dark text-center text-xl">Cargando usuarios...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        id="admin-container"
        className="relative min-h-screen pb-24 text-white"
        style={{ background: 'var(--brand-background)' }}
      >
        <div className="max-w-[95%] 2xl:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <section className="hero-section overflow-hidden ring-1 ring-inset ring-yellow-300/25">
            <div className="hero-bg opacity-70" />
            <div className="relative px-8 py-10 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <span className="tag-legendary inline-flex items-center gap-2">
                    Control maestro
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-white">Gestión de usuarios</h1>
                  <p className="text-sm text-white/70 max-w-2xl">
                    Administra roles, permisos y accesos bajo la misma estética gamer neon que el resto del panel.
                  </p>
                </div>
                <span className="chip-option chip-option-active text-[11px] uppercase tracking-[0.35em]">
                  {users.length} perfiles
                </span>
              </div>
            </div>
          </section>

          {/* Administradores y Vendedores */}
          <section className="card-dark p-0 overflow-hidden">
            <div className="bg-white/10 border-b border-white/10 px-6 py-5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>👑</span> Administradores y vendedores
              </h3>
              <p className="text-sm text-white/60">Personal autorizado con permisos especiales.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white/75">
                <thead className="bg-white/5 text-[11px] uppercase tracking-[0.35em] text-yellow-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Usuario</th>
                    <th className="px-6 py-3 text-left font-semibold">Rol</th>
                    <th className="px-6 py-3 text-left font-semibold">Fecha registro</th>
                    <th className="px-6 py-3 text-left font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {users.filter(user => user.role === 'admin' || user.role === 'vendedor').map((user) => (
                    <tr key={user.uid} className="transition-colors duration-200 hover:bg-yellow-300/10">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-base font-semibold text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-white/55">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.uid ? (
                          <select
                            defaultValue={user.role}
                            onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                            className="input-web text-sm max-w-xs md:w-auto"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${getRoleColor(user.role || 'cliente')}`}>
                            {user.role || 'cliente'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/60">
                        {user.createdAt ? (() => {
                          try {
                            const date = (user.createdAt as any)?.toDate ? (user.createdAt as any).toDate() : new Date(user.createdAt);
                            return date.toLocaleDateString('es-CL');
                          } catch (error) {
                            return 'Fecha inválida';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.uid ? (
                          <button
                            onClick={() => setEditingUser(null)}
                            className="btn-secondary-web text-xs px-4 py-2"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setEditingUser(user.uid)}
                              className="btn-primary-web text-xs px-4 py-2"
                            >
                              Editar
                            </button>
                            {user.uid !== userProfile?.uid && (
                              <button
                                onClick={() => deleteUser(user.uid)}
                                className="btn-outline-web text-xs px-4 py-2 border-pink-400 text-pink-200 hover:bg-pink-500/10 hover:text-pink-100"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Clientes */}
          <section className="card-dark p-0 overflow-hidden">
            <div className="bg-white/10 border-b border-white/10 px-6 py-5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>👥</span> Clientes registrados
              </h3>
              <p className="text-sm text-white/60">Usuarios que compran y siguen la tienda.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white/75">
                <thead className="bg-white/5 text-[11px] uppercase tracking-[0.35em] text-yellow-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Usuario</th>
                    <th className="px-6 py-3 text-left font-semibold">Rol</th>
                    <th className="px-6 py-3 text-left font-semibold">Fecha registro</th>
                    <th className="px-6 py-3 text-left font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {users.filter(user => !user.role || user.role === 'cliente').map((user) => (
                    <tr key={user.uid} className="transition-colors duration-200 hover:bg-yellow-300/10">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-base font-semibold text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-white/55">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.uid ? (
                          <select
                            defaultValue={user.role || 'cliente'}
                            onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                            className="input-web text-sm max-w-xs md:w-auto"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${getRoleColor(user.role || 'cliente')}`}>
                            {user.role || 'cliente'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/60">
                        {user.createdAt ? (() => {
                          try {
                            const date = (user.createdAt as any)?.toDate ? (user.createdAt as any).toDate() : new Date(user.createdAt);
                            return date.toLocaleDateString('es-CL');
                          } catch (error) {
                            return 'Fecha inválida';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.uid ? (
                          <button
                            onClick={() => setEditingUser(null)}
                            className="btn-secondary-web text-xs px-4 py-2"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setEditingUser(user.uid)}
                              className="btn-primary-web text-xs px-4 py-2"
                            >
                              Editar
                            </button>
                            {user.uid !== userProfile?.uid && (
                              <button
                                onClick={() => deleteUser(user.uid)}
                                className="btn-outline-web text-xs px-4 py-2 border-pink-400 text-pink-200 hover:bg-pink-500/10 hover:text-pink-100"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-8 bg-slate-800/70 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-white mb-4">Cómo crear usuarios vendedor</h2>
            <div className="space-y-3 text-sm text-yellow-300">
              <p><strong>Opción 1 - Firebase Console:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Ve a Firebase Console &gt; Authentication &gt; Users</li>
                <li>Haz clic en "Add user"</li>
                <li>Ingresa email y contraseña</li>
                <li>Aquí en esta página, cambia el rol a "Vendedor"</li>
              </ol>

              <p className="mt-4"><strong>Opción 2 - Desde el sitio:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>El vendedor se registra normalmente en /auth</li>
                <li>Por defecto tendrá rol "Cliente"</li>
                <li>Aquí cambias su rol a "Vendedor"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
