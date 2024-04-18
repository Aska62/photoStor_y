
import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase.config.js";
import moment from "moment";
import { toast } from 'react-toastify';
import { PHOTOS_PAGE_URL, IMG_SIZE_THUMB_L, IMG_THUMB_L } from '../constants.js';
import Header from "../components/Header";
import CategoryOption from "../components/CategoryOption.jsx";

const Photos = () => {
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
        );
      }

      // Execute query
      const querySnap = await getDocs(q);

      if (querySnap.docs.length > 0) {
        let fetchedPhotoInfo = [];
        // Alter to list
        querySnap.forEach((doc) => {
          // Image path
          const imagePath = `photos/${auth.currentUser.uid}/${doc.data().orientation}/${IMG_THUMB_L}`;
          // Get photo URL
          const photoRef = ref(storage, `${imagePath}/${doc.data().photoRef}_${IMG_SIZE_THUMB_L}`);

          getDownloadURL(photoRef).then((url) => {
            fetchedPhotoInfo = [...fetchedPhotoInfo, {
              id: doc.id,
              data: doc.data(),
              photoURL: url,
            }]

            setPhotoInfoList(fetchedPhotoInfo);
          })
        })
      } else {
        setPhotoInfoList([]);
      }
    } catch (err) {
      toast.error('Error fetching data')
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
      <Header />
      <main className="main main_photos">
        <h2 className="page-title">Photos</h2>
        <div className="photo-list_heading-box">
          <Link
            className="btn link link-btn link-btn_add"
            to={`${PHOTOS_PAGE_URL}/add`}
          >
            Add New
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
          {photoInfoList.length === 0 ? <>
            <p className="note_no-record-found">No photo registered</p>
          </> : <>
            {photoInfoList.map((info, index) => (
              <div className="photo-list-card" key={index}>
                <Link
                  to={`/photos/view/${info.id}`}
                  className="link"
                >
                  <img
                    src={info.photoURL}
                    alt={info.data.title}
                    className="photo-list_img"
                  />
                </Link>
                <div className="link photo-list_info">
                  <Link
                    to={`/photos/view/${info.id}`}
                    className="link"
                  >
                    <h3 className="photo-list_title">{info.data.title}</h3>
                  </Link>
                  <p>{moment.unix(info.data.date.seconds).format("YYYY-MM-DD")}</p>
                  {info.data.hide ? <div className="photo-hidden-icon photo-hidden-icon_list">Hidden</div> : <></>}
                </div>
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