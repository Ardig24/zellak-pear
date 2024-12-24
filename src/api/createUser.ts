import { getAuth } from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function createUser(username: string, password: string) {
  try {
    // Create a placeholder email since Firebase requires it
    const email = `${username.toLowerCase()}@placeholder.com`;
    
    // Create a new auth instance
    const newAuth = getAuth();
    
    // Create the user with placeholder email
    const userCredential = await createUserWithEmailAndPassword(newAuth, email, password);
    
    // Store the username mapping
    await setDoc(doc(db, 'usernames', username.toLowerCase()), {
      uid: userCredential.user.uid,
      username: username.toLowerCase()
    });
    
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
