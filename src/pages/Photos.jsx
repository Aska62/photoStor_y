
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.config.js";
import { PHOTOS_PAGE_URL } from '../constants.js';
import Header from "../components/Header";

const Photos = ({ headerWhite }) => {
  const auth = getAuth();

  const [photoList, setPhotoList] = useState([]);

  // Ref to the destinate directory
	const imageListRef = ref(storage, `photos/${auth.currentUser.uid}/resized`);
  let loaded = false;

	useEffect(() => {
    if (!loaded) {
      listAll(imageListRef).then((res) => {
        res.items.forEach((item) => {
          getDownloadURL(item).then((url) => {
            setPhotoList((prev) => [...prev, url]);
          })
        });
      });
      loaded = true;
    }
	}, []);

  // const fetchPhotos = () => {
  //   try {

  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  return (
    <>
      <Header white={headerWhite} />
      <main className="main main_photos">
        <Link to={`${PHOTOS_PAGE_URL}/add`}>Add New Photo</Link>
        {photoList.map((url) => {
          return <img src={url} />
        })}
      </main>
    </>
  )
}

export default Photos