import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, storage } from "../firebase.config";
import { getAuth } from 'firebase/auth';
import { collection, getDocs, addDoc, query, where, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import { v4 } from "uuid";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from "../components/Header";

const Photo = ({ headerWhite }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const params = useParams();
  const categFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [photoToUpload, setPhotoToUpload] = useState(null);
  const [hidePhoto, setHidePhoto] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: undefined,
    location: '',
    categoryRef: '',
    note: '',
    hide: false,
    photoRef: ''
  });
  const {
    title,
    date,
    location,
    categoryRef,
    note,
    hide
  } = formData;

  // Fetch categories on page load
  useEffect(()=> {
    if (categFetched.current === false) {
      // Fetch all category of the user
      const fetchCategories = async () => {
        const categRef = collection(db, 'categories');

        try {
          let q = query(
            categRef,
            where('userRef', '==', auth.currentUser.uid)
          )

          const querySnap = await getDocs(q);

          let fetchedCateg = [];
          querySnap.forEach((doc) => {
            fetchedCateg.push({
              id: doc.id,
              name: doc.data().name,
            });
          });

          setCategories(fetchedCateg);
          setLoading(false);
        } catch(err) {
          console.log(err);
        }
      }

      fetchCategories();
      categFetched.current = true;
    }
  }, []);

  const onInputChange = (e) => {

    if (['title', 'location', 'note'].includes(e.target.id)) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value.trim(),
      }));
    } else if (e.target.id === "date") {
      setFormData((prevState) => ({
        ...prevState,
        ['date']: Timestamp.fromMillis(Date.parse(e.target.value))
      }));
    } else if (e.target.id === 'hide') {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: !hidePhoto,
      }));
      setHidePhoto(!hidePhoto);
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value,
      }));
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // validation
    let hasError = false;

    if (!photoToUpload) {
      console.log('Please choose a photo');
      hasError = true;
    }
    if (title.length === 0) {
      console.log('Please input title');
      hasError = true;
    }
    if (!date) {
      console.log('Please select date');
      hasError = true;
    }
    if (location.length === 0) {
      console.log('Please input location');
      hasError = true;
    }
    if (categoryRef.length === 0) {
      console.log('Please choose category');
      hasError = true;
    }
    if (note.length === 0) {
      console.log('Please input note');
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      return;
    }

    // Prepare complete data for update
    const formDataCopy = {
      ...formData,
      userRef: auth.currentUser.uid,
    }

    if (params.photoId) {
      // Update if editing existing photo
      console.log('existing photo')
    } else {
      // Upload photo to firebase storage
      // Create File reference
      const photoId = v4();
      const imageRef = ref(storage, `photos/${auth.currentUser.uid}/${photoId}`);
      uploadBytes(imageRef, photoToUpload)
        .then(() => {
          try {
            // Update database
            formDataCopy.photoRef = photoId;
            addDoc(collection(db, 'photos'), formDataCopy);
            toast.success('Data stored successfully');
            navigate('/photos');
          } catch (err) {
            toast.error('Failed to store data');
            console.log(err);
          } finally {
            setLoading(false);
          }
        })
        .catch ((err) => {
          toast.error('Failed to upload photo');
          console.log(err);
          setLoading(false);
        })
      }
  }

  return (
    <>
      <Header white={headerWhite} />
      <main className="main main_photo">
        {loading ? <p>Loading...</p> : <>
          <form className="photo-info-form">
            <div className="photo-info-container photo-info-container_1">
              <input
                type='file'
                accept="image/png, image/jpeg"
                id='photo'
                name='photo'
                className="photo-input photo-input_image"
                onChange={(e) => setPhotoToUpload(e.target.files[0])}
                // onChange={(e) => {onInputChange(e)}}
              />
            </div>
            <ul className="photo-info-container photo-info-container_1">
              <li className="photo-info-box">
                <label className="photo-input-label" >Title</label>
                <input
                  type='text'
                  id='title'
                  name='title'
                  className="photo-input"
                  onChange={(e) => onInputChange(e)}
                >
                </input>
              </li>
              <li className="photo-info-box">
                <label className="photo-input-label" >Date</label>
                <input
                  type='date'
                  id='date'
                  name='date'
                  className="photo-input"
                  onChange={(e) => onInputChange(e)}
                >
                </input>
              </li>
              <li className="photo-info-box">
                <label className="photo-input-label" >Location</label>
                <input
                  type='text'
                  id='location'
                  name='location'
                  className="photo-input"
                  onChange={(e) => onInputChange(e)}
                >
                </input>
              </li>
              <li className="photo-info-box">
                <label className="photo-input-label" >Category</label>
                <select
                  id='categoryRef'
                  name='categoryRef'
                  className="photo-input photo-input_select"
                  onChange={(e) => onInputChange(e)}
                >
                  <option value="">Please select</option>
                  {categories.map((category, index) => (
                    <option value={category.id} key={index}>{category.name}</option>
                  ))}
                </select>
              </li>
              <li className="photo-info-box">
                <label className="photo-input-label" >Note</label>
                <textarea
                  id='note'
                  name='note'
                  className="photo-input photo-input_text"
                  onChange={(e) => onInputChange(e)}
                >
                </textarea>
              </li>
              <li className="photo-info-box">
                <input
                  type='checkbox'
                  id='hide'
                  name='hide'
                  value={true}
                  className="photo-input photo-input_check"
                  onChange={(e) => onInputChange(e)}
                >
                </input>
                <label className="photo-input-label" >Hide photo</label>
              </li>
            </ul>
            <div className="photo-bnt-container">
              <button onClick={(e) => onSubmit(e)}>Save</button>
              <button>Cancel</button>
              <button>Delete</button>
            </div>
          </form>
        </>}
      </main>
    </>
  )
}

export default Photo