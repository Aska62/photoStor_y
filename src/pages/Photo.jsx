import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { storage } from "../firebase.config.js";
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes } from "firebase/storage";
import { v4 } from "uuid";
import { toast } from 'react-toastify';
import Header from "../components/Header";
import 'react-toastify/dist/ReactToastify.css';

const Photo = ({ headerWhite }) => {
  const auth = getAuth();
  const navigate = useNavigate();

  const [photoToUpload, setPhotoToUpload] = useState(null);

  const uploadPhoto = (e) => {
    e.preventDefault();
    toast.error('test');
		if (photoToUpload == null) return;

		// Create File reference
		const imageRef = ref(storage, `photos/${auth.currentUser.uid}/${v4()}`);
		// Upload to firebase storage
    try {
      uploadBytes(imageRef, photoToUpload)
        .then(() => {
          navigate('/photos');
          // TODO: Adjust notification
          toast.success('Successfully uploaded');
        })
    } catch (err) {
      toast.error('Failed to upload');
      console.log(err);
    }
	}

  return (
    <>
      <Header white={headerWhite} />
      <div>Photo</div>
      <form>
        <div>
          <input
            type='file'
            accept="image/png, image/jpeg"
            onChange={(e) => setPhotoToUpload(e.target.files[0])}
          />
          <button onClick={(e) => uploadPhoto(e)}>Upload</button>
        </div>
      </form>
    </>
  )
}

export default Photo