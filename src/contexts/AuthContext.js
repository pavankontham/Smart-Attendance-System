import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { dbHelpers } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, userData) {
    console.log('Starting signup process for:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Firebase user created:', userCredential.user.uid);

    // Create user profile in Supabase
    const profileData = {
      firebase_id: userCredential.user.uid,
      email: email,
      name: userData.name,
      role: userData.role,
      student_id: userData.student_id || null,
      subject: userData.subject || null,
      created_at: new Date().toISOString()
    };

    console.log('Creating user profile in database:', profileData);
    const { data, error } = await dbHelpers.createUser(profileData);
    if (error) {
      console.error('Database user creation failed:', error);
      throw new Error(error.message);
    }

    console.log('User profile created successfully:', data);
    // Set the user profile immediately
    setUserProfile(data);

    return userCredential;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Check if user profile exists, if not, they need to complete registration
    const { data, error } = await dbHelpers.getUserByFirebaseId(result.user.uid);
    if (!data || error) {
      // User doesn't exist in our database, they need to complete profile
      throw new Error('PROFILE_INCOMPLETE');
    }

    return result;
  }

  async function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  async function refreshUserProfile() {
    if (!currentUser) return;

    try {
      const { data, error } = await dbHelpers.getUserByFirebaseId(currentUser.uid);
      if (data && !error) {
        setUserProfile(data);
        console.log('User profile refreshed:', data);
      } else {
        console.error('Error refreshing user profile:', error);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.uid : 'null');
      setCurrentUser(user);

      if (user) {
        // Fetch user profile from Supabase
        try {
          const { data, error } = await dbHelpers.getUserByFirebaseId(user.uid);
          console.log('User profile fetch result:', { data, error });

          if (data && !error) {
            setUserProfile(data);
            console.log('User profile set:', data);
          } else {
            // User exists in Firebase but not in our database
            // This can happen with Google Sign-In
            console.log('User not found in database, setting profile to null');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    refreshUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
