"use client";

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function AuthListener() {
  useEffect(() => {
    if (!auth || !db) return; // Firebase not initialized

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if email verification status changed
        const userDocRef = doc(db, "pending_users", user.uid);
        try {
          // Update email verification status in Firestore
          await updateDoc(userDocRef, {
            emailVerified: user.emailVerified
          });
        } catch (error) {
          // Document might not exist yet, ignore
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return null; // This component doesn't render anything
}