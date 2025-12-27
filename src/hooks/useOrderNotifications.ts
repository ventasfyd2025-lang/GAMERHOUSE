'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAuth, type UserProfile } from './useUserAuth';

export function useOrderNotifications() {
  const [unreadOrderMessages, setUnreadOrderMessages] = useState(0);
  const { currentUser, isRegistered } = useUserAuth();
  const shouldListen = Boolean(currentUser && isRegistered);

  useEffect(() => {
    if (!shouldListen || !currentUser) {
      return;
    }

    const registeredUser = currentUser as UserProfile;
    const userUid = registeredUser.uid;
    const userEmail = registeredUser.email;

    // Query for unread messages from admin for the current user's orders
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('userId', '==', userUid),
      where('isAdmin', '==', true),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const unreadCount = snapshot.size;
      console.log(`📧 Found ${unreadCount} unread messages for ${userEmail}`);
      setUnreadOrderMessages(unreadCount);
    }, (error) => {
      console.error('❌ Error en notificaciones de pedidos:', error);
      console.log('User email:', userEmail);
      console.log('Error code:', error.code);
      setUnreadOrderMessages(0);
    });

    return () => unsubscribe();
  }, [shouldListen, currentUser, isRegistered]);

  return shouldListen ? unreadOrderMessages : 0;
}
