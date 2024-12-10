import { getAuth } from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export async function createUser(email: string, password: string) {
  try {
    // Create a new auth instance
    const newAuth = getAuth();
    
    // Create the user
    const userCredential = await createUserWithEmailAndPassword(newAuth, email, password);
    
    // Sign out from the new auth instance to not affect current session
    await newAuth.signOut();
    
    return {
      uid: userCredential.user.uid
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error;
  }
}
