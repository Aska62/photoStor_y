
import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, getStorage, listAll, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase.config.js";
import { PHOTOS_PAGE_URL } from '../constants.js';
import Header from "../components/Header";
import { RESIZED_PHOTO_SIZE } from '../constants.js';

const Photos = ({ headerWhite }) => {
  const auth = getAuth();
  const photosFetched = useRef(false);
  const storage = getStorage(); // Firebase storage

  const [photoInfoList, setPhotoInfoList] = useState([]);
  const [loading, setLoading] = useState(false);

	useEffect(() => {
    if (photosFetched.current === false) {
      setLoading(true);
      fetchPhotoInfo();

      // listAll(imageListRef).then((res) => {
      //   // console.log(res)
      //   res.items.forEach((item) => {
      //     getDownloadURL(item).then((url) => {
      //       setPhotoList((prev) => [...prev, url]);
      //     })
      //   });
      // });
      photosFetched.current = true;
      setLoading(false);
    }
    console.log(photoInfoList)
	}, []);

  const fetchPhotoInfo = async () => {
    try {
      // Create reference
      const photoInfoRef = collection(db, 'photos');

      // Create query
      let q = query(
        photoInfoRef,
        where('userRef', '==', auth.currentUser.uid),
        orderBy('date', 'asc')
      );

      // Execute query
      const querySnap = await getDocs(q);

      // Alter to list
      let fetchedPhotoInfo = [];
      querySnap.forEach((doc) => {
        // Image path
        const imagePath = `photos/${auth.currentUser.uid}/resized`;
        // // Get photo URL
        const photoRef = ref(storage, `${imagePath}/${doc.data().photoRef}_${RESIZED_PHOTO_SIZE}`);
        // TODO:
        getDownloadURL(photoRef).then((url) => {
          fetchedPhotoInfo = [...fetchedPhotoInfo, {
            id: doc.id,
            data: doc.data(),
            photoURL: url,
          }]
          setPhotoInfoList(fetchedPhotoInfo);
          console.log(fetchedPhotoInfo)
        })
      })
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Header white={headerWhite} />
      <main className="main main_photos">
        <Link to={`${PHOTOS_PAGE_URL}/add`}>Add New Photo</Link>
        {loading ? (<>Loading...</>) : (<>
          {photoInfoList.length > 0 && <>
            {photoInfoList.map((info, index) => (
              <Link to={`/photos/view/${info.id}`} key={index}>
                <p>{info.data.title}</p>
                <img src={info.photoURL} alt={info.data.title} />
              </Link>
            ))}
            </>
          }
        </>)}

      </main>
    </>
  )
}

export default Photos