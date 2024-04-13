import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, storage } from "../firebase.config";
import { getAuth } from 'firebase/auth';
import { doc, collection, getDoc, getDocs, query, where, Timestamp, updateDoc, } from 'firebase/firestore';
import { ref, getStorage, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 } from "uuid";
import moment from "moment";
import Header from "../components/Header";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineDateRange } from "react-icons/md";
import { RESIZED_PHOTO_SIZE } from '../constants.js';

const Photo = ({ headerWhite }) => {
  const auth = getAuth();
  const storage = getStorage();
  const navigate = useNavigate();
  const params = useParams();
  const infoFetched = useRef(false);

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [photoInfo, setPhotoInfo] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [originalPhotoURL, setOriginalPhotoURL] = useState('');
  const [photoToUpload, setPhotoToUpload] = useState(null);
  const [imagePreviewData, setImagePreviewData] = useState(null);
  const [changeImage, setChangeImage] = useState(false);
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
      setLoading(true);

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

      fetchPhoto();
      fetchCategories();
      infoFetched.current = true;
    }
  }, []);

  const fetchPhoto = async () => {
    try {
      const photoRef = doc(db, 'photos', params.id);

      // Execute query
      const docSnap = await getDoc(photoRef);

      if (docSnap.exists()) {
        // Get category name
        const categRef = doc(db, 'categories', docSnap.data().categoryRef);
        const categSnap = await getDoc(categRef);

        if (categSnap.data().name) {
          setCategoryName(categSnap.data().name);
        } else {
          console.log('Category not registered')
        }

        // Get photo URL
        const imagePath = `photos/${auth.currentUser.uid}/${docSnap.data().photoRef}`;
        const photoRef = ref(storage, imagePath);
        getDownloadURL(photoRef).then(url => {
          setOriginalPhotoURL(url);
          setImagePreviewData(url);
        });

        setPhotoInfo(docSnap.data());
        setFormData({ ...docSnap.data()});
        setLoading(false);
      } else {
        navigate('/photos');
        toast.error('Photo does not exist');
      }
    } catch(err) {
      console.log(err);
      navigate('/photos');
      toast.error('Issue fetching photo info');
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
    setImagePreviewData(null)
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
      setChangeImage(true);
    } else {
      toast.error('Failed to read the file');
    }
  }

  // Cancel image change
  const cancelImageChange = (e) => {
    e.preventDefault();
    setImagePreviewData(originalPhotoURL);
    setChangeImage(false);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // validation
    let hasError = false;

    if (changeImage && !photoToUpload) {
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

    // Prepare data for update
    let formDataCopy = {
      ...formData,
      userRef: auth.currentUser.uid,
      createdAt: Timestamp.now(),
    }

    if (changeImage) {
      // Create File reference
      const photoId = v4();
      const imageRef = ref(storage, `photos/${auth.currentUser.uid}/${photoId}`);

      // Upload photo to firebase storage
      uploadBytes(imageRef, photoToUpload)
        .then(() => {
          // Get photo path
          const originalImagePath = `photos/${auth.currentUser.uid}/${photoRef}`;
          const resizedImagePath = `photos/${auth.currentUser.uid}/resized/${photoRef}_${RESIZED_PHOTO_SIZE}`;
          // Get reference
          const originalRef = ref(storage, originalImagePath);
          const resizedRef = ref(storage, resizedImagePath);

          // Delete files
          try {
            deleteObject(originalRef);
            deleteObject(resizedRef)
          } catch (err) {
            console.log('error deleting photo')
            console.log(err)
          }
        })
        .then(() => {
          // Update database
          formDataCopy = {
            ...formDataCopy,
            photoRef: photoId
          }
          try {
            const photoRef = doc(db, 'photos', params.id);
            updateDoc(photoRef, formDataCopy);
            toast.success('Data stored successfully');
          } catch (err) {
            toast.error('Failed to store data');
            console.log(err);
          } finally {
            fetchPhoto();
            setEditing(false);
            setLoading(false);
          }
        })
        .catch ((err) => {
          toast.error('Failed to upload photo');
          console.log(err);
          setLoading(false);
        })
    } else {
      try {
        // Update database
        const photoRef = doc(db, 'photos', params.id);
        updateDoc(photoRef, formDataCopy);
        toast.success('Data stored successfully');
      } catch (err) {
        toast.error('Failed to store data');
        console.log(err);
      } finally {
        fetchPhoto();
        setEditing(false);
        setLoading(false);
      }
    }
  }

  return (
    <>
      <Header white={headerWhite} />
      <main className="main main_photo">
        {loading ? <p>Loading...</p> : <>
          <form className="photo-form-container">
            {photoInfo ? (<>
              <div className="photo-form_main">
                <div className="photo-form_image-container">
                  <img
                    className='photo-for-view'
                    src={imagePreviewData}
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
                      className={`btn btn_gray btn_photo-cancel btn_large btn_photo-edit-cancel ${editing ? '' : 'btn_hidden'} ${changeImage ? '' : 'btn_disabled'}`}
                      disabled={changeImage ? false : true}
                      onClick={(e) => cancelImageChange(e)}
                    >
                      Choose Original
                    </button>
                  </div>
                </div>
                <div className="photo-form_info-container">
                  <div className={`photo-info-box ${editing ? 'photo-info_hidden' : ''}`}>
                    <h3 className="photo-info photo-info_title">{photoInfo.title}</h3>
                    <p className="photo-info"><IoLocationOutline/> {photoInfo.location}</p>
                    <p className="photo-info"><MdOutlineDateRange/> {moment.unix(photoInfo.date.seconds).format("YYYY-MM-DD")}</p>
                    <p className="photo-info">Category: {categoryName}</p>
                    <p className="photo-info photo-info_note">{photoInfo.note}</p>
                    {photoInfo.hide ? <div className="photo-info photo-hidden">Hidden</div> : <></>}
                  </div>
                  <div className={`${editing ? '' : 'photo-info_hidden'}`}>
                    <div className="photo-info_input-box">
                      <label htmlFor='title'>Title </label>
                      <input
                        type='text'
                        id='title'
                        className="photo-info_input"
                        value={title}
                        placeholder="Title"
                        onChange={(e) => onInputChange(e)}
                      />
                    </div>
                    <div className="photo-info_input-box">
                      <IoLocationOutline/>
                      <input
                        type='text'
                        id='location'
                        className="photo-info_input"
                        value={location}
                        placeholder="Location"
                        onChange={(e) => onInputChange(e)}
                      />
                    </div>
                    <div className="photo-info_input-box">
                      <MdOutlineDateRange/>
                      <input
                        type='date'
                        id='date'
                        className="photo-info_input"
                        value={moment.unix(date.seconds).format("YYYY-MM-DD")}
                        placeholder="Date"
                        onChange={(e) => onInputChange(e)}
                      />
                    </div>
                    <div className="photo-info_input-box">
                      <label htmlFor='title'>Category </label>
                      <select
                        id='categoryRef'
                        name='categoryRef'
                        className="photo-info_input photo-info_select"
                        onChange={(e) => onInputChange(e)}
                        defaultValue={categoryRef}
                      >
                        <option value="">Please select</option>
                        {categories.map((category, index) => (
                          <option
                            value={category.id}
                            key={index}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="photo-info_input-box_textarea">
                      <label htmlFor='note' className="photo-info_label_textarea">Note </label>
                      <textarea
                        id='note'
                        className="photo-info_textarea"
                        value={note}
                        placeholder="Note"
                        onChange={(e) => onInputChange(e)}
                      />
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
                      className={`btn ${editing ? 'btn_hidden' : ''}`}
                      onClick={() => navigate('/photos')}
                    >
                      Back to List
                    </button>
                    <button
                      type='button'
                      className={`btn ${editing ? 'btn_hidden' : ''}`}
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                    <button
                      type='button'
                      className={`btn ${editing ? '' : 'btn_hidden'}`}
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className={`btn ${editing ? '' : 'btn_hidden'}`}
                      onClick={(e) => onSubmit(e)}
                    >
                      Save
                    </button>
                    <button
                      type='button'
                      className='btn btn_cancel'
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
                className={`btn ${editing ? 'btn_hidden' : ''}`}
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