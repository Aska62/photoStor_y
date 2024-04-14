import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase.config";
import { getAuth } from 'firebase/auth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import { v4 } from "uuid";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from "../components/Header";
import CategoryOption from "../components/CategoryOption";

const AddPhoto = ({ headerWhite }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const categFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [photoToUpload, setPhotoToUpload] = useState(null);
  const [imagePreviewData, setImagePreviewData] = useState(null);
  const [hidePhoto, setHidePhoto] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: undefined,
    location: '',
    categoryRef: '',
    note: '',
    photoRef: ''
  });
  const {
    title,
    date,
    location,
    categoryRef,
    note,
  } = formData;

  const onFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      // Set data for preview
      reader.onload = (e) => {
        setImagePreviewData(e.target.result);
      };
      reader.readAsDataURL(file);

      // Set data to save to DB
      setPhotoToUpload(file);
    } else {
      toast.error('Failed to read the file');
    }
  }

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
      createdAt: Timestamp.now(),
    }

    // Create File reference
    const photoId = v4();
    const imageRef = ref(storage, `photos/${auth.currentUser.uid}/${photoId}`);

    // Upload photo to firebase storage
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

  const onCancelClick = (e) => {
    e.preventDefault();
    if (window.confirm('The data will not be saved. Are you sure to cancel editing?')) {
      navigate('/photos');
    }
  }

  return (
    <>
      <Header white={headerWhite} />
      <main className="main main_photo">
        {loading ? <p>Loading...</p> : <>
          <form className="photo-form-container">
            <div className="photo-form_main">
              <div className="photo-form_image-container">
                <img
                  className="photo-for-view"
                  src={imagePreviewData}
                />
                <input
                  type='file'
                  accept="image/png, image/jpeg"
                  id='photo'
                  name='photo'
                  className="photo-input photo-input_image"
                  onChange={(e) => onFileSelect(e)}
                />
              </div>
              <ul className="photo-form_info-container">
                <li className="photo-info_input-box">
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
                <li className="photo-info_input-box">
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
                <li className="photo-info_input-box">
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
                <li className="photo-info_input-box">
                  <label className="photo-input-label" >Category</label>
                  <select
                    id='categoryRef'
                    name='categoryRef'
                    className="photo-input photo-input_select"
                    onChange={(e) => onInputChange(e)}
                  >
                    <CategoryOption categFetched={categFetched} defMessage='Please select' />
                  </select>
                </li>
                <li className="photo-info_input-box_textarea">
                  <label className="photo-input-label" >Note</label>
                  <textarea
                    id='note'
                    name='note'
                    className="photo-info_textarea"
                    onChange={(e) => onInputChange(e)}
                  >
                  </textarea>
                </li>
                <li className="photo-info_input-box_checkbox">
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
                <li className="photo-btn-box photo-btn-box_two">
                  <button className='btn' onClick={(e) => onSubmit(e)}>Save</button>
                  <button className='btn btn_cancel' onClick={(e) => onCancelClick(e)}>Cancel</button>
                </li>
              </ul>
            </div>
          </form>
        </>}
      </main>
    </>
  )
}

export default AddPhoto