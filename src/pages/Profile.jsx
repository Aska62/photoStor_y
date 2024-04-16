import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import Header from "../components/Header";

const Profile = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const profFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profAltered, setProfAltered] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    email: '',
    description: '',
  });

  const {
    name,
    userName,
    email,
    description
  } = formData;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/

  const userRef = doc(db, 'users', auth.currentUser.uid);

  useEffect(() => {
    if (profFetched.current === false) {
      setLoading(true);
      fetchProfileInfo();
      profFetched.current = true;
    }
  }, []);

  const fetchProfileInfo = async () => {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      setFormData({ ...docSnap.data() });
      setLoading(false);
    } else {
      navigate('/');
      toast.error('Profile does not exist');
      console.log('Profile does not exist')
    }
  }

  const onInputChange = (e) => {
    if (['userName', 'description', 'email'].includes(e.target.id)) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value.trim()
      }))
    }
    setProfAltered(true)
  }

  const onSubmit = async (e) => {
    console.log('submit')
    e.preventDefault();
    setLoading(true);


    // validation
    let hasError = false;

    if (userName.length === 0) {
      console.log('Please input title');
      hasError = true;
    }
    if (description.length === 0) {
      console.log('Please describe yourself');
      hasError = true;
    }
    if (email.length === 0) {
      console.log('Please input email address');
      hasError = true;
    }
    if(!email.match(emailRegex)) {
      console.log('Invalid email');
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      return;
    }

    let formDataCopy = {
      ...formData,
      updatedAt: Timestamp.now()
    }

    try {
      updateDoc(userRef, formDataCopy);
      setEditing(false);
      setProfAltered(false);
      setLoading(false);
      toast.success('Profile updated');
    } catch (err) {
      console.log(err)
      toast.error('Failed to update profile')
    }
  }

  const onEditCancel = () => {
    if (!profAltered) {
      setEditing(false);
    } else if (window.confirm('The modification will not be saved. Are you sure to cancel editing?')) {
      setEditing(false);
      setProfAltered(false);
      fetchProfileInfo();
    }
  }

  return (
    <>
      <Header />
      <main className="main main_profile">
        <h2 className="main-title main-title_top">Profile</h2>
        <div className="main-image main-image_profile">
          <div className="main-image-cover main-image-cover_profile">
          </div>
          <form className="profile-container">
            {loading ? <>
              Loading...
            </> : <>
              <input
                type="text"
                name="userName"
                id="userName"
                className={`input profile-input ${editing ? 'input_editing input_editing_profile' : ''}`}
                placeholder="Input user name..."
                disabled={editing ? false : true}
                value={userName || name}
                onChange={(e) => onInputChange(e)}
              />
              <textarea
                name="description"
                id="description"
                className={`input profile-input profile-input_textarea ${editing ? 'input_editing textarea_editing' : ''}`}
                placeholder="Describe yourself..."
                cols="50"
                rows="10"
                disabled={editing ? false : true}
                value={description}
                onChange={(e) => onInputChange(e)}
              />
              <label htmlFor="email" className="email-label">
                email:
                <input
                  type="email"
                  name="email"
                  id="email"
                  className={`input profile-input profile-input_email ${editing ? 'input_editing input_editing_profile' : ''}`}
                  placeholder="Input email..."
                  disabled={editing ? false : true}
                  value={email}
                  onChange={(e) => onInputChange(e)}
                />
              </label>
              <button
                type='button'
                className={`btn btn_edit-categories ${editing ? 'hidden' : ''}`}
                onClick={() => setEditing(true)}
                disabled={editing ? true : false}
              >
                Edit
              </button>
              <div className={`profile-btn_edit-box ${!editing ? 'hidden' : ''}`}>
                <button
                  type='button'
                  className="btn btn_save-profile"
                  onClick={(e) => onSubmit(e)}
                >
                  Save
                </button>
                <button
                  type='button'
                  className='btn btn_cancel btn_cancel-profile'
                  onClick={onEditCancel}
                >
                  Cancel
                </button>
              </div>
            </>}
          </form>
        </div>
        <p className="main-title main-title_bottom">Profile</p>
      </main>
    </>
  )
}

export default Profile