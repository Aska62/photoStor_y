import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, storage } from "../firebase.config";
import { getAuth } from 'firebase/auth';
import { doc, getDoc, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { toast } from 'react-toastify';
import { v4 } from "uuid";
import moment from "moment";
import Header from "../components/Header";
import CategoryOption from "../components/CategoryOption";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineDateRange } from "react-icons/md";
import {
  IMG_PORTRAIT,
  IMG_LANDSCAPE,
  IMG_PANORAMA,
  IMG_SQUARE,
  IMG_LARGE,
  IMG_THUMB_S,
  IMG_THUMB_L,
  IMG_SIZE_PORTRAIT,
  IMG_SIZE_LANDSCAPE,
  IMG_SIZE_PANORAMA,
  IMG_SIZE_SQUARE,
  IMG_SIZE_THUMB_S,
  IMG_SIZE_THUMB_L,
} from '../constants.js';

const Photo = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const params = useParams();
  const infoFetched = useRef(false);
  const categFetched = useRef(false);

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photoInfo, setPhotoInfo] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [originalPhotoURL, setOriginalPhotoURL] = useState('');
  const [origImageOrientation, setOrigImageOrientation] = useState('');
  const [photoToUpload, setPhotoToUpload] = useState(null);
  const [imagePreviewData, setImagePreviewData] = useState(null);
  const [imageOrientation, setImageOrientation] = useState('');
  const [changeImage, setChangeImage] = useState(false);
  const [inputAltered, setInputAltered] = useState(false);
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
    hide: false,
    photoRef: ''
  });

  const {
    title,
    date,
    location,
    categoryRef,
    note,
    hide,
    photoRef
  } = formData;

  useEffect(()=> {
    if (infoFetched.current === false) {
      fetchPhoto();
      infoFetched.current = true;
    }
  }, []);

  const fetchPhoto = async () => {
    setLoading(true);
    const photoRef = doc(db, 'photos', params.id);

    // Execute query
    const docSnap = await getDoc(photoRef);

    if (docSnap.exists()) {
      let categName;

      // get image size
      let imageSize;
      switch(docSnap.data().orientation) {
        case IMG_PORTRAIT:
          imageSize = IMG_SIZE_PORTRAIT;
          break;
        case IMG_PANORAMA:
          imageSize = IMG_SIZE_PANORAMA;
          break;
        case IMG_SQUARE:
          imageSize = IMG_SIZE_SQUARE;
          break;
        default:
          imageSize = IMG_SIZE_LANDSCAPE;
          break;
      }

      // Get photo URL
      const imagePath = `photos/${auth.currentUser.uid}/${docSnap.data().orientation}/lg/${docSnap.data().photoRef}_${imageSize}`;
      // Get ref
      const photoRef = ref(storage, imagePath);

      getDownloadURL(photoRef)
        .then((url) => {
          setOriginalPhotoURL(url);
          setImagePreviewData(url);
        })
        .then(async () => {
           // if categoryRef does not exists, set category name as not registered
          if (docSnap.data().categoryRef.length === 0) {
            categName = 'NOT REGISTERED';
          } else {
            // If categoryRef exists, get category name from DB
            const categRef = doc(db, 'categories', docSnap.data().categoryRef);
            const categDoc = await getDoc(categRef);
            categName = categDoc.data().name;
          }
        })
        .then(() => {
          setCategoryName(categName);
          setPhotoInfo(docSnap.data());
          setImageOrientation(docSnap.data().orientation);
          setOrigImageOrientation(docSnap.data().orientation);
          setFormData({ ...docSnap.data()});
          setLoading(false);
        })
        .catch((err) => {
          navigate('/photos');
          toast.error('Error fetching data');
          console.log(err);
        })
    } else {
      navigate('/photos');
      toast.error('Photo does not exist');
    }
  }

  const onInputChange = (e) => {
    setInputAltered(true);
    if (['title', 'location', 'note'].includes(e.target.id)) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value
      }));
    } else if (e.target.id === "date") {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: Timestamp.fromMillis(Date.parse(e.target.value))
      }));
    } else if (e.target.id === 'hide') {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: !hide,
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: e.target.value,
      }));
    }
  }

  const onFileSelect = (e) => {
    setImagePreviewData(null);
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
      setImagePreviewData(null);
      setPhotoToUpload(null);
      toast.error('Failed to read the file');
    }
    setChangeImage(true);
  }

  // Cancel image change
  const cancelImageChange = (e) => {
    e.preventDefault();
    setImagePreviewData(originalPhotoURL);
    setImageOrientation(origImageOrientation);
    setChangeImage(false);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

      setFormData((prevState) => ({
        ...prevState,
        title: prevState.title.trim,
        location: prevState.location.trim,
        note: prevState.note.trim,
      }));

    // validation
    let hasError = false;

    setImageErr('');
    setTitleErr('');
    setDateErr('');
    setLocationErr('');
    setCategoryErr('');
    setNoteErr('');

    if (changeImage && !photoToUpload) {
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

    // Prepare data for update
    let formDataCopy = {
      ...formData,
      userRef: auth.currentUser.uid,
      updatedAt: Timestamp.now(),
    }

    if (changeImage) {
      // Create File reference
      const photoId = v4();
      const baseImageUrl = `photos/${auth.currentUser.uid}/${imageOrientation}`;
      const imageRef = ref(storage, `${baseImageUrl}/${photoId}`);

      // Upload photo to firebase storage
      uploadBytes(imageRef, photoToUpload)
        .then(() => {
          // Get photo path
          const refs = getImageRefToDelete();

          // Delete files
          try {
            refs.forEach(ref => {
              deleteObject(ref);
            });
          } catch (err) {
            console.log('error deleting photo')
            console.log(err)
          }
        })
        .then(() => {
          // Update database
          formDataCopy = {
            ...formDataCopy,
            orientation: imageOrientation,
            photoRef: photoId,
            updatedAt: Timestamp.now()
          }

          const photoRef = doc(db, 'photos', params.id);

          updateDoc(photoRef, formDataCopy)
            .then(() => {
              // Wait until new image URL to be ready
              // Prepare for resized image URL check
              let lgSize;
              switch(imageOrientation) {
                case IMG_PORTRAIT:
                  lgSize = IMG_SIZE_PORTRAIT;
                  break;
                case IMG_PANORAMA:
                  lgSize = IMG_SIZE_PANORAMA;
                  break;
                case IMG_SQUARE:
                  lgSize = IMG_SIZE_SQUARE;
                  break;
                default:
                  lgSize = IMG_SIZE_LANDSCAPE;
                  break;
              }

              const resizedImagePath = `${baseImageUrl}/lg/${photoId}_${lgSize}`;

              // Wait for resized image URL
              const getUrlPromise = new Promise ((res, rej) => {
                const resizedImageRef = ref(storage, resizedImagePath);

                // Keep checking url until it is ready
                const intervalId = setInterval(async () => {
                  const url = await getDownloadURL(resizedImageRef);
                  if (url) {
                    clearInterval(intervalId);
                    res('Resized image url is ready');
                  }
                }, 1000);
              })

              getUrlPromise
                .then((msg) => {
                  fetchPhoto();
                  setEditing(false);
                  setChangeImage(false);
                  toast.success('Data stored successfully');
                  console.log(msg);
                })
                .catch((msg) => {
                  toast.error('Error while getting new photo URL');
                  setEditing(false);
                  setChangeImage(false);
                  setLoading(false);
                  console.log(msg);
                })
              })
            })
            .catch((err) => {
              toast.error('Failed to store data');
              console.log(err);
              setLoading(false);
            });
    } else {
      try {
        // Update database
        const photoRef = doc(db, 'photos', params.id);
        updateDoc(photoRef, formDataCopy)
          .then(() => {
            fetchPhoto();
          })
          .then(() => {
            setEditing(false);
            setLoading(false);
            toast.success('Data stored successfully');
          })
      } catch (err) {
        toast.error('Failed to store data');
        setLoading(false);
        console.log(err);
      }
    }
  }

  const onDelete = async (e) => {
    e.preventDefault();

    if (window.confirm("You have 'hidden' option. Are you sure you want to delete?")) {
      try {
        // Delete the record
        deleteDoc(doc(db, 'photos', params.id))
          .then(()=> {
            // Get photo path
            const refs = getImageRefToDelete();

            // Delete files
            try {
              refs.forEach(ref => {
                deleteObject(ref);
              });

              navigate('/photos');
              toast.success('Deleted the photo data');
            } catch (err) {
              toast.error('Error deleting photo')
              console.log(err)
            }
          })
      } catch (err) {
        toast.error('Failed to delete the record');
        console.log(err)
      }
    }
  }

  const getImageRefToDelete = () => {
    // Get the resized img size (lg)
    let lgSize;
    switch(origImageOrientation) {
      case IMG_PORTRAIT:
        lgSize = IMG_SIZE_PORTRAIT;
        break;
      case IMG_PANORAMA:
        lgSize = IMG_SIZE_PANORAMA;
        break;
      case IMG_SQUARE:
        lgSize = IMG_SIZE_SQUARE;
        break;
      default:
        lgSize = IMG_SIZE_LANDSCAPE;
        break;
    }

    // Get paths
    const baseImagePath = `photos/${auth.currentUser.uid}/${origImageOrientation}`;
    const originalPath = `${baseImagePath}/${photoRef}`;
    const thumbsPath = `${baseImagePath}/${IMG_THUMB_S}/${photoRef}_${IMG_SIZE_THUMB_S}`;
    const thumblPath = `${baseImagePath}/${IMG_THUMB_L}/${photoRef}_${IMG_SIZE_THUMB_L}`;
    const lgPath = `${baseImagePath}/${IMG_LARGE}/${photoRef}_${lgSize}`;

    // Return refs
    return [
      ref(storage, originalPath),
      ref(storage, thumbsPath),
      ref(storage, thumblPath),
      ref(storage, lgPath)
    ]
  }

  const onCancelClick = () => {
    if ((!inputAltered && !changeImage) || window.confirm('The modification will not be saved. Are you sure to cancel editing?')) {
      setImageErr('');
      setTitleErr('');
      setDateErr('');
      setLocationErr('');
      setCategoryErr('');
      setNoteErr('');

      // Set image as original
      setImagePreviewData(originalPhotoURL);
      setImageOrientation(origImageOrientation);
      setChangeImage(false);

      // Set form data back to original
      setFormData({ ...photoInfo });

      setEditing(false);
    }
  }

  return (
    <>
      <Header />
      <main className="main main_photo">
        <h2 className="page-title">Photo</h2>
        {loading ? <p>Loading...</p> : <>
          <form className="photo-form-container">
            {photoInfo ? (<>
              <div className="photo-form_main">
                <div className="photo-form_image-container">
                  <img
                    className={`photo-for-view ${imageOrientation ? 'photo-preview_'+imageOrientation : ''}`}
                    src={imagePreviewData}
                    alt='preview'
                  />
                  <div className="image-edit-box">
                    <input
                      type='file'
                      accept="image/png, image/jpeg"
                      id='photo'
                      name='photo'
                      className={`photo-input photo-input_image ${editing ? '' : 'photo-input_image_hidden'}`}
                      onChange={(e) => onFileSelect(e)}
                    />
                    <button
                      className={`btn btn_gray btn_photo-cancel btn_large ${editing ? '' : 'hidden'} ${changeImage ? '' : 'btn_disabled'}`}
                      disabled={changeImage ? false : true}
                      onClick={(e) => cancelImageChange(e)}
                    >
                      Choose Original
                    </button>
                    <p className="form-err form-err_photo form-err_img">{imageErr ?? imageErr}</p>
                    {imageOrientation}
                  </div>
                  <div className={`radio-container ${editing ? '' : 'hidden'}`}>
                    <p className="radio-title radio-title_add-photo">Orientation:</p>
                    <label htmlFor="orientation" className="radio-label">
                      <input
                        type="radio"
                        name='orientation'
                        value={IMG_LANDSCAPE}
                        className="radio"
                        checked={imageOrientation === IMG_LANDSCAPE}
                        onChange={() => setImageOrientation(IMG_LANDSCAPE)}
                        disabled={!changeImage}
                      />
                      Landscape
                    </label>
                    <label htmlFor="orientation" className="radio-label">
                      <input
                        type="radio"
                        name='orientation'
                        value={IMG_PORTRAIT}
                        className="radio"
                        checked={imageOrientation === IMG_PORTRAIT}
                        onChange={() =>  setImageOrientation(IMG_PORTRAIT)}
                        disabled={!changeImage}
                      />
                      Portrait
                    </label>
                    <label htmlFor="orientation" className="radio-label">
                      <input
                        type="radio"
                        name='orientation'
                        value={IMG_PANORAMA}
                        className="radio"
                        checked={imageOrientation === IMG_PANORAMA}
                        onChange={() => setImageOrientation(IMG_PANORAMA)}
                        disabled={!changeImage}
                      />
                      Panorama
                    </label>
                    <label htmlFor="orientation" className="radio-label">
                      <input
                        type="radio"
                        name='orientation'
                        value={IMG_SQUARE}
                        className="radio"
                        checked={imageOrientation === IMG_SQUARE}
                        onChange={() => setImageOrientation(IMG_SQUARE)}
                        disabled={!changeImage}
                      />
                      Square
                    </label>
                  </div>
                </div>
                <div className="photo-form_info-container">
                  <div className={`photo-info-box ${editing ? 'photo-info_hidden' : ''}`}>
                    <h3 className="photo-info photo-info_title">{photoInfo.title}</h3>
                    <p className="photo-info"><IoLocationOutline/> {photoInfo.location}</p>
                    <p className="photo-info"><MdOutlineDateRange/> {moment.unix(photoInfo.date.seconds).format("YYYY-MM-DD")}</p>
                    <p className="photo-info">Category: {categoryName}</p>
                    <p className="photo-info photo-info_note">{photoInfo.note}</p>
                    {photoInfo.hide ? <div className="photo-info photo-hidden-icon">Hidden</div> : <></>}
                  </div>
                  <div className={`${editing ? '' : 'photo-info_hidden'}`}>
                    <div className="photo-info_input-box">
                      <label htmlFor='title'>Title </label>
                      <input
                        type='text'
                        id='title'
                        className={`photo-info_input ${titleErr ? 'input_err' : ''}`}
                        value={title}
                        placeholder="Title"
                        onChange={(e) => onInputChange(e)}
                      />
                      <p className="form-err form-err_photo">{titleErr ?? titleErr}</p>
                    </div>
                    <div className="photo-info_input-box">
                      <IoLocationOutline/>
                      <input
                        type='text'
                        id='location'
                        className={`photo-info_input ${locationErr ? 'input_err' : ''}`}
                        value={location}
                        placeholder="Location"
                        onChange={(e) => onInputChange(e)}
                      />
                      <p className="form-err form-err_photo">{locationErr ?? locationErr}</p>
                    </div>
                    <div className="photo-info_input-box">
                      <MdOutlineDateRange/>
                      <input
                        type='date'
                        id='date'
                        className={`photo-info_input ${dateErr ? 'input_err' : ''}`}
                        value={moment.unix(date.seconds).format("YYYY-MM-DD")}
                        placeholder="Date"
                        onChange={(e) => onInputChange(e)}
                      />
                      <p className="form-err form-err_photo">{dateErr ?? dateErr}</p>
                    </div>
                    <div className="photo-info_input-box">
                      <label htmlFor='title'>Category</label>
                      <select
                        id='categoryRef'
                        name='categoryRef'
                        className={`photo-info_input photo-info_select ${categoryErr ? 'input_err' : ''}`}
                        onChange={(e) => onInputChange(e)}
                        value={categoryRef}
                      >
                        <CategoryOption categFetched={categFetched} defMessage='Please select' />
                      </select>
                      <p className="form-err form-err_photo">{categoryErr ?? categoryErr}</p>
                    </div>
                    <div className="photo-info_input-box_textarea">
                      <label htmlFor='note' className="photo-info_label_textarea">Note </label>
                      <textarea
                        id='note'
                        className={`photo-info_textarea ${noteErr ? 'input_err' : ''}`}
                        value={note}
                        placeholder="Note"
                        onChange={(e) => onInputChange(e)}
                      />
                      <p className="form-err form-err_photo">{noteErr ?? noteErr}</p>
                    </div>
                    <div className="photo-info_input-box_checkbox">
                      <input
                        type='checkbox'
                        id='hide'
                        name='hide'
                        value={true}
                        className="photo-info_checkbox"
                        onChange={(e) => onInputChange(e)}
                        checked={hide ? true : false}
                      />
                      <label className="photo-input-label" > Hide photo</label>
                    </div>
                  </div>
                  <div className="photo-btn-box">
                    <button
                      type='button'
                      className={`btn ${editing ? 'hidden' : ''}`}
                      onClick={() => navigate('/photos')}
                    >
                      Back to List
                    </button>
                    <button
                      type='button'
                      className={`btn ${editing ? 'hidden' : ''}`}
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                    <button
                      type='button'
                      className={`btn ${editing ? '' : 'hidden'}`}
                      onClick={onCancelClick}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className={`btn ${editing ? '' : 'hidden'}`}
                      onClick={(e) => onSubmit(e)}
                    >
                      Save
                    </button>
                    <button
                      type='button'
                      className='btn btn_cancel'
                      onClick={(e) => onDelete(e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </>) : (<>
              No photo info found
              <button
                type='button'
                className={`btn ${editing ? 'hidden' : ''}`}
                onClick={() => navigate('/photos')}
              >
                Back to List
              </button>
            </>
          )}
          </form>
        </>}
      </main>
    </>
  )
}

export default Photo