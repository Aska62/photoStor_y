import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import Header from "../components/Header";
import { OWNER_USER_ID } from '../constants.js';

const Profile = ({ detectMobMenuOpen, isMobMenuOpen }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const profFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profAltered, setProfAltered] = useState(false);
  const [userNameErr, setUserNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [descErr, setDescErr] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    email: '',
    description: '',
  });

  const {
    userName,
    email,
    description
  } = formData;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/

  const userRef = doc(db, 'users', OWNER_USER_ID);

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
    }
  }

  const onInputChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value
    }))
    setProfAltered(true)
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let formDataCopy = {
      userName: formData.userName.trim(),
      description: formData.description.trim(),
      email: formData.email.trim(),
      updatedAt: Timestamp.now()
    }

    // validation
    let hasError = false;

    setUserNameErr('');
    setDescErr('');
    setEmailErr('');

    if (formDataCopy.userName.length === 0) {
      setUserNameErr('Please input user name');
      hasError = true;
    }
    if (formDataCopy.description.length === 0) {
      setDescErr('Please describe yourself');
      hasError = true;
    }
    if (formDataCopy.email.length === 0) {
      setEmailErr('Please input email address');
      hasError = true;
    } else if(!formDataCopy.email.match(emailRegex)) {
      setEmailErr('Invalid email address');
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      return;
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

  const onEditCancel = (e) => {
    e.preventDefault();

    if (!profAltered) {
      setEditing(false);
    } else if (window.confirm('The modification will not be saved. Are you sure to cancel editing?')) {
      setUserNameErr('');
      setDescErr('');
      setEmailErr('');

      setEditing(false);
      setProfAltered(false);
      fetchProfileInfo();
    }
  }

  return (
    <>
      <Header detectMobMenuOpen={detectMobMenuOpen} />
      <main className={`main main_profile ${isMobMenuOpen ? 'main_frozen' : ''}`}>
        <h2 className="main-title main-title_top_profile">Profile</h2>
        <div className="main-image main-image_profile" onContextMenu={(e)=> e.preventDefault()}>
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
                className={`input profile-input ${editing ? 'input_editing_profile' : ''} ${userNameErr ? 'input_err' : ''}`}
                placeholder="Input user name..."
                disabled={editing ? false : true}
                value={userName}
                onChange={(e) => onInputChange(e)}
              />
              <p className="form-err form-err_profile">{userNameErr ?? userNameErr}</p>
              <textarea
                name="description"
                id="description"
                className={`input profile-input profile-input_textarea ${editing ? 'textarea_editing' : ''} ${descErr ? 'input_err' : ''}`}
                placeholder="Describe yourself..."
                cols="50"
                rows="10"
                disabled={editing ? false : true}
                value={description}
                onChange={(e) => onInputChange(e)}
              />
              <p className="form-err form-err_profile">{descErr ?? descErr}</p>
              <label htmlFor="email" className="email-label">
                email:
                <input
                  type="email"
                  name="email"
                  id="email"
                  className={`input profile-input profile-input_email ${editing ? 'input_editing_profile' : ''} ${emailErr ? 'input_err' : ''}`}
                  placeholder="Input email..."
                  disabled={editing ? false : true}
                  value={email}
                  onChange={(e) => onInputChange(e)}
                />
              </label>
              <p className="form-err form-err_profile">{emailErr ?? emailErr}</p>
              {auth.currentUser && <>
                <button
                  type='button'
                  className={`btn btn_edit_profile ${editing ? 'hidden' : ''}`}
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
                    onClick={(e) => onEditCancel(e)}
                  >
                    Cancel
                  </button>
                </div>
              </>}
            </>}
          </form>
        </div>
        <p className="main-title main-title_bottom_profile">Profile</p>
      </main>
    </>
  )
}

export default Profile