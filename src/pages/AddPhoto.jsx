import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase.config";
import { getAuth } from 'firebase/auth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import { v4 } from "uuid";
import { toast } from 'react-toastify';
import Header from "../components/Header";
import CategoryOption from "../components/CategoryOption";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineDateRange } from "react-icons/md";
import {
  IMG_PORTRAIT,
  IMG_LANDSCAPE,
  IMG_PANORAMA
} from '../constants.js';

const AddPhoto = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const categFetched = useRef(false);

  const [loading, setLoading] = useState(false);
  const [photoToUpload, setPhotoToUpload] = useState(null);
  const [imagePreviewData, setImagePreviewData] = useState(null);
  const [imageOrientation, setImageOrientation] = useState('');
  const [hidePhoto, setHidePhoto] = useState(false);
  const [titleErr, setTitleErr] = useState('');
  const [dateErr, setDateErr] = useState('');
  const [locationErr, setLocationErr] = useState('');
  const [categoryErr, setCategoryErr] = useState('');
  const [noteErr, setNoteErr] = useState('');
  const [imageErr, setImageErr] = useState('');
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
        const img = new Image();
        img.onload = function() {
          // Get the dimensions of the image
          const width = img.width;
          const height = img.height;

          // Set image orientation necessary for resize
          if (width > height * 1.8) {
            setImageOrientation(IMG_PANORAMA);
          } else if (width > height) {
            setImageOrientation(IMG_LANDSCAPE);
          } else {
            setImageOrientation(IMG_PORTRAIT);
          }
        }
        img.src = e.target.result;
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
        [e.target.id]: Timestamp.fromMillis(Date.parse(e.target.value))
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

    setImageErr('');
    setTitleErr('');
    setDateErr('');
    setLocationErr('');
    setCategoryErr('');
    setNoteErr('');

    if (!photoToUpload) {
      setImageErr('Please choose a photo');
      hasError = true;
    }
    if (title.length === 0) {
      setTitleErr('Please input title');
      hasError = true;
    }
    if (!date) {
      setDateErr('Please choose date');
      hasError = true;
    }
    if (location.length === 0) {
      setLocationErr('Please input location');
      hasError = true;
    }
    if (categoryRef.length === 0) {
      setCategoryErr('Please choose category');
      hasError = true;
    }
    if (note.length === 0) {
      setNoteErr('Please input note');
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      return;
    }

    // Prepare complete data for update
    const formDataCopy = {
      ...formData,
      orientation: imageOrientation,
      userRef: auth.currentUser.uid,
      createdAt: Timestamp.now(),
    }

    // Create File reference
    const photoId = v4();
    const imageRef = ref(storage, `photos/${auth.currentUser.uid}/${imageOrientation}/${photoId}`);

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
          console.log(err);
          toast.error('Failed to store data');
        }
      })
      .catch ((err) => {
        toast.error('Failed to upload photo');
        console.log(err);
      })
      .finally(() => {
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
      <Header />
      <main className="main main_photo">
        {loading ? <p>Loading...</p> : <>
          <form className="photo-form-container">
            <div className="photo-form_main">
              <div className="photo-form_image-container">
                <img
                  className={`photo-for-view ${imageOrientation ? 'photo-preview_'+imageOrientation : ''}`}
                  src={imagePreviewData}
                  alt='preview'
                />
                <input
                  type='file'
                  accept="image/png, image/jpeg"
                  id='photo'
                  name='photo'
                  className="photo-input photo-input_image"
                  onChange={(e) => onFileSelect(e)}
                />
                <p className="form-err form-err_photo form-err_img form-err_img_add">{imageErr ?? imageErr}</p>
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
                  />
                  <p className="form-err form-err_photo">{titleErr ?? titleErr}</p>
                </li>
                <li className="photo-info_input-box">
                  <MdOutlineDateRange/>
                  <input
                    type='date'
                    id='date'
                    name='date'
                    className="photo-input"
                    onChange={(e) => onInputChange(e)}
                  />
                  <p className="form-err form-err_photo">{dateErr ?? dateErr}</p>
                </li>
                <li className="photo-info_input-box">
                  <IoLocationOutline/>
                  <input
                    type='text'
                    id='location'
                    name='location'
                    className="photo-input"
                    onChange={(e) => onInputChange(e)}
                  />
                  <p className="form-err form-err_photo">{locationErr ?? locationErr}</p>
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
                  <p className="form-err form-err_photo">{categoryErr ?? categoryErr}</p>
                </li>
                <li className="photo-info_input-box_textarea">
                  <label className="photo-input-label" >Note</label>
                  <textarea
                    id='note'
                    name='note'
                    className="photo-info_textarea"
                    onChange={(e) => onInputChange(e)}
                  />
                  <p className="form-err form-err_photo">{noteErr ?? noteErr}</p>
                </li>
                <li className="photo-info_input-box_checkbox_add">
                  <input
                    type='checkbox'
                    id='hide'
                    name='hide'
                    value={true}
                    className="photo-input photo-input_check"
                    onChange={(e) => onInputChange(e)}
                  >
                  </input>
                  <label className="photo-input-label_hide" >Hide photo</label>
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