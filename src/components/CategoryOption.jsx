import { useState, useEffect } from "react";
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from "../firebase.config";

const CategoryOption = ({ categFetched, defMessage }) => {
  const auth = getAuth();

  const [categories, setCategories] = useState([]);

  useEffect(()=> {
    // Fetch categories on page load
    if (categFetched.current === false) {
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
        } catch(err) {
          console.log(err);
        }
      }

      fetchCategories();
    }
  }, []);

  return (
    <>
      <option value="">{defMessage}</option>
      {categories.map((category, index) => (
        <option value={category.id} key={index}>{category.name}</option>
      ))}
    </>
  )
}

export default CategoryOption