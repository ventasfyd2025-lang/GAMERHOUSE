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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Cargando...</div>
        </div>
      </Layout>
    );
  }

  // Bloquear acceso si no es admin
  if (!currentUser || !isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
            <p className="text-yellow-300/80">
              Solo los administradores pueden gestionar usuarios.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="bg-yellow-400 text-white px-6 py-2 rounded-md hover:bg-yellow-400-hover transition-colors"
            >
              Volver al Panel Admin
            </button>
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
      case 'admin': return 'bg-slate-800 text-pink border-slate-700';
      case 'vendedor': return 'bg-warning/20 text-secondary border-warning';
      case 'cliente': return 'bg-success/20 text-success border-success';
      default: return 'bg-slate-800 text-white border-yellow-300/30';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Cargando usuarios...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 py-8">
        <div className="max-w-full mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
            <p className="text-yellow-300/80">Administra roles y permisos de usuarios</p>
          </div>

          {/* Administradores y Vendedores */}
          <div className="admin-card mb-8">
            <div className="px-6 py-4 bg-slate-800 border-b border-yellow-300/30">
              <h3 className="text-lg font-medium text-yellow-300">👑 Administradores y Vendedores</h3>
              <p className="text-sm text-yellow-300/60">Personal autorizado con permisos especiales</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/80 divide-y divide-gray-200">
                  {users.filter(user => user.role === 'admin' || user.role === 'vendedor').map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-lg font-bold text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-yellow-300/60">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.uid ? (
                          <select
                            defaultValue={user.role}
                            onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                            className="admin-input text-sm py-1 px-2 max-w-xs"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                            {user.role || 'cliente'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-300/60">
                        {user.createdAt ? (() => {
                          try {
                            const date = (user.createdAt as any)?.toDate ? (user.createdAt as any).toDate() : new Date(user.createdAt);
                            return date.toLocaleDateString('es-CL');
                          } catch (error) {
                            return 'Fecha inválida';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingUser === user.uid ? (
                          <button
                            onClick={() => setEditingUser(null)}
                            className="admin-button-secondary text-xs"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUser(user.uid)}
                              className="admin-button text-xs"
                            >
                              Editar
                            </button>
                            {user.uid !== userProfile?.uid && (
                              <button
                                onClick={() => deleteUser(user.uid)}
                                className="admin-button-secondary text-xs bg-pink/20 text-pink border-pink/30 hover:bg-pink/30"
                              >
                                Eliminar
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clientes */}
          <div className="admin-card">
            <div className="px-6 py-4 bg-slate-800 border-b border-yellow-300/30">
              <h3 className="text-lg font-medium text-yellow-300">👥 Clientes</h3>
              <p className="text-sm text-yellow-300/60">Usuarios registrados de la tienda</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-300/60 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/80 divide-y divide-gray-200">
                  {users.filter(user => !user.role || user.role === 'cliente').map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-lg font-bold text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-yellow-300/60">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.uid ? (
                          <select
                            defaultValue={user.role || 'cliente'}
                            onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                            className="text-sm border border-yellow-300/40 rounded px-2 py-1"
                          >
                            <option value="cliente">Cliente</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role || 'cliente')}`}>
                            {user.role || 'cliente'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-300/60">
                        {user.createdAt ? (() => {
                          try {
                            const date = (user.createdAt as any)?.toDate ? (user.createdAt as any).toDate() : new Date(user.createdAt);
                            return date.toLocaleDateString('es-CL');
                          } catch (error) {
                            return 'Fecha inválida';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingUser === user.uid ? (
                          <button
                            onClick={() => setEditingUser(null)}
                            className="admin-button-secondary text-xs"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUser(user.uid)}
                              className="admin-button text-xs"
                            >
                              Editar
                            </button>
                            {user.uid !== userProfile?.uid && (
                              <button
                                onClick={() => deleteUser(user.uid)}
                                className="admin-button-secondary text-xs bg-pink/20 text-pink border-pink/30 hover:bg-pink/30"
                              >
                                Eliminar
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 bg-slate-900/80 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-white mb-4">Cómo crear usuarios vendedor</h2>
            <div className="space-y-3 text-sm text-yellow-300/80">
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