import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import { FaGoogle } from "react-icons/fa";

const OAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onGoogleClick = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check for user
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        navigate('/');
      } else {
        // If user doesn't exist, error
        auth.signOut();
        toast.error('The account does not exist');
        console.log('The account does not exist');
        //   await setDoc(doc(db, 'users', user.uid), {
        //     name: user.displayName,
        //     userName: user.displayName,
        //     email: user.email,
        //     timestamp: serverTimestamp()
        //   })
      }

    } catch (error) {
      toast.error('Could not authorize with Google');
    }
  }

  return (
    <div>
      <p>Sign {location.pathname === '/sign-up' ? 'up' : 'in'} with </p>
      <FaGoogle onClick={onGoogleClick} />
    </div>
  )
}

export default OAuth