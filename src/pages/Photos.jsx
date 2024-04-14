
import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase.config.js";
import moment from "moment";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PHOTOS_PAGE_URL, RESIZED_PHOTO_SIZE } from '../constants.js';
import Header from "../components/Header";
import CategoryOption from "../components/CategoryOption.jsx";

const Photos = ({ headerWhite }) => {
  const auth = getAuth();
  const photosFetched = useRef(false);
  const categFetched = useRef(false);

  const [photoInfoList, setPhotoInfoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryRef, setCategoryRef] = useState(null);

	useEffect(() => {
    if (photosFetched.current === false) {
      fetchPhotoInfo();
      photosFetched.current = true;
    }
	}, [categoryRef]);

  const fetchPhotoInfo = async () => {
    setLoading(true);
    let emptyCategory = false;

    try {
      // Create reference
      const photoInfoRef = collection(db, 'photos');

      // Create query
      let q = query(
        photoInfoRef,
        where('userRef', '==', auth.currentUser.uid),
        orderBy('date', 'asc'),
      );

      // Add categoryRef as a condition if category is selected
      if (categoryRef) {
        q = query(
          q,
          where('categoryRef', '==', categoryRef)
        )
      }

      // Execute query
      let querySnap = await getDocs(q);

      // If no matching record, clear category selection
      if (categoryRef && querySnap.docs.length === 0) {
        q = query(
          photoInfoRef,
          where('userRef', '==', auth.currentUser.uid),
          orderBy('date', 'asc'),
        );

        querySnap = await getDocs(q);
        emptyCategory = true;
      }

      // Alter to list
      let fetchedPhotoInfo = [];
      querySnap.forEach((doc) => {
        // Image path
        const imagePath = `photos/${auth.currentUser.uid}/resized`;
        // Get photo URL
        const photoRef = ref(storage, `${imagePath}/${doc.data().photoRef}_${RESIZED_PHOTO_SIZE}`);

        getDownloadURL(photoRef).then((url) => {
          fetchedPhotoInfo = [...fetchedPhotoInfo, {
            id: doc.id,
            data: doc.data(),
            photoURL: url,
          }]
          setPhotoInfoList(fetchedPhotoInfo);
        })
      })
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false)
    }
  }

  const onCategoryChange = (e) => {
    e.preventDefault();

    setCategoryRef(e.target.value);
    // Set useRef as false to fetch photo in useEffect
    photosFetched.current = false;
  }

  return (
    <>
      <Header white={headerWhite} />
      <main className="main main_photos">
        <div className="photo-list_heading-box">
          <Link
            className="btn link link-btn link-btn_add"
            to={`${PHOTOS_PAGE_URL}/add`}
          >
            Add New Photo
          </Link>
          <div className="list-category-selector">
            <label>Category </label>
            <select
              defaultValue={categoryRef}
              onChange={(e) => onCategoryChange(e)}
            >
              <CategoryOption categFetched={categFetched} defMessage='All' />
            </select>
          </div>
        </div>
        {loading ? (<>Loading...</>) : (<>
          {photoInfoList.length > 0 && <>
            {photoInfoList.map((info, index) => (
              <div className="photo-list-card">
                <Link
                  to={`/photos/view/${info.id}`}
                  key={index}
                  className="link"
                >
                  <img
                    src={info.photoURL}
                    alt={info.data.title}
                    className="photo-list_img"
                  />
                </Link>
                <Link
                  to={`/photos/view/${info.id}`}
                  key={index}
                  className="link photo-list_info"
                >
                  <h3 className="photo-list_title">{info.data.title}</h3>
                  <div className="photo-hidden-icon photo-hidden-icon_list">Hidden</div>
                </Link>
              </div>
            ))}
            </>
          }
        </>)}

      </main>
    </>
  )
}

export default Photos