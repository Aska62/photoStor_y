import { useState, useEffect } from "react";
import { collection, doc, getDocs, query, where, addDoc, writeBatch, deleteDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import { MdOutlineCancel } from "react-icons/md";
import Header from "../components/Header";

const Categories = () => {
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState(false);
  const [nameAltered, setNameAltered] = useState(false);

  const categRef = collection(db, 'categories');
  const photoRef = collection(db, 'photos');

  useEffect(()=> {
    fetchCategories();
  }, []);

  // Fetch all category of the user
  const fetchCategories = async () => {
    try {
      // Get categories
      let q = query(
        categRef,
        where('userRef', '==', auth.currentUser.uid)
      )
      const categQuerySnap = await getDocs(q);
      let fetchedCateg = [];

      if (!categQuerySnap.empty) {
        // Get number of photos registered
        categQuerySnap.forEach(async (doc) => {
          let photoQ = query(
            photoRef,
            where('categoryRef', '==', doc.id)
          )
          let photoSnap = await getDocs(photoQ);
          let photoCount = (photoSnap.empty) ? 0 : photoSnap.size;

          fetchedCateg.push({
            id: doc.id,
            name: doc.data().name,
            editedName: '',
            photoCount
          });

          setCategories(fetchedCateg);
        });
      }

      setLoading(false);
    } catch(err) {
      console.log(err);
    }
  }

  // Add new category
  const onNewCategorySubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    let categ = newCategory;

    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name: categ,
        userRef: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      });

      if (docRef) {
        fetchCategories();
        setAddingNew(false);
        setNewCategory('');
      }
    } catch (err) {
      console.log('failed to add data');
      setLoading(false);
    }
  }

  // Cancel adding new category on outside the modal click
  const onOutsideModalClick = (e) => {
    if (e.target.className.includes("add-categ_background")) {
      setAddingNew(false);
    }
  }

  // Input new category name to change existing category
  const onCategoryChange = (editedName, id) => {
    const editedCategories = categories.map(category => {
      return (category.id === id) ? { id: category.id, name: category.name, editedName: editedName } : category;
    });

    setCategories(editedCategories);
    setNameAltered(true);
  }

  // Update existing category
  const onUpdate = async () => {
    // Filter non-modified categories
    const categToUpdate = categories.filter((category) => category.editedName.length > 0);

    // Update
    if (nameAltered) {
      // Use batch to update multiple records
      // Prepare data to update
      const batch = writeBatch(db);
      Object.values(categToUpdate).forEach(category => {
        const docRef = doc(db, 'categories', category.id);
        batch.update(docRef, {
          name: category.editedName,
          updatedAt: Timestamp.now(),
        })
      });

      // Update
      batch.commit()
        .then(()=> {
          alert('successfully updated');
          setEditing(false);
          fetchCategories();
        })
        .catch ((err) => {
        console.log(err);
        });
    } else {
      setEditing(false);
    }
  }

  // Cancel editing existing categories
  const onEditCancel = () => {
    if (!nameAltered) {
      setEditing(false);
    } else if (window.confirm('The modification will not be saved. Are you sure to cancel editing?')) {
      setEditing(false);
      setNameAltered(false);
      fetchCategories();
    }
  }

  // Delete existing category
  const onDeleteCategory = async (categoryId, categoryName, photoCount) => {
    if (!window.confirm(`Delete '${categoryName}'?`)) return;
    if (photoCount > 0) {
      if (!window.confirm(`The category of ${photoCount} photo records(s) will be empty. OK to proceed?`)) return;
    }

    // Check for photos with the target category assigned
    const photoRef = collection(db, 'photos');
    let q = query(
      photoRef,
      where('categoryRef', '==', categoryId)
    )
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      // If the related photo data exists, update those categoryRef
      try {
        // Prepare data to update
        const batch = writeBatch(db);
        querySnap.forEach((photo) => {
          let docRef = doc(db, 'photos', photo.id);
          batch.update(docRef, {
            categoryRef: '',
            updatedAt: Timestamp.now(),
          })
        });

        // Execute update
        batch.commit()
          .then(() => {
            // Delete the category
            deleteDoc(doc(db, "categories", categoryId))
            .then(() => {
              fetchCategories();
              toast.success(`'${categoryName}' deleted`);
              console.log(`'${categoryName}' deleted`)
            })
            .catch(() => {
              toast.error(`Failed to delete '${categoryName}'`);
              console.log(`Failed to delete '${categoryName}'`);
            })
          })
      } catch (err) {
        toast.error('Error updating related photo data');
        console.log('Error updating related photo data');
        console.log(err);
      }
    } else {
      deleteDoc(doc(db, "categories", categoryId))
        .then(() => {
          fetchCategories();
          toast.success(`'${categoryName}' deleted`);
          console.log(`'${categoryName}' deleted`)
        })
        .catch(() => {
          toast.error(`Failed to delete '${categoryName}'`);
          console.log(`Failed to delete '${categoryName}'`);
        })
    }
  }

  return (
    <>
      <Header />
      <main className={`main main_categories ${addingNew ? 'no-scroll' : ''}`}>
        <h2 className="page-title">Categories</h2>
        {loading ? <p>Loading...</p> : <>
          <section className="categ-container">
            <button
              type="button"
              className="btn btn_add-category"
              onClick={() => {setAddingNew(true)}}
              disabled={editing ? true : false}
            >
              Add New
            </button>
            {categories && categories.length > 0 ? (
              <form className="categories-edit-form">
                <button
                  type='button'
                  className={`btn btn_edit-categories ${editing ? 'hidden' : ''}`}
                  onClick={() => setEditing(true)}
                  disabled={addingNew ? true : false}
                >
                  Edit
                </button>
                <div className={`categories-btn_edit-box ${!editing ? 'hidden' : ''}`}>
                  <button
                    type='button'
                    className="btn btn_save-categories"
                    onClick={onUpdate}
                  >
                    Save
                  </button>
                  <button
                    type='button'
                    className='btn btn_cancel btn_cancel-categories'
                    onClick={onEditCancel}
                  >
                    Cancel
                  </button>
                </div>
                <ul className="category-ul">
                  {categories.map((category, index) => (
                    <li className="category-li" key={index}>
                      <MdOutlineCancel
                        className={`categ-del-btn ${editing ? 'categ-del-btn_visible' : ''}`}
                        onClick={() => onDeleteCategory(category.id, category.name, category.photoCount)}
                      />
                      <input
                        type='text'
                        name='category'
                        id={category.id}
                        value={category.editedName.length > 0 ? category.editedName : category.name}
                        className={`input category-input ${editing ? 'input_editing' : ''}`}
                        disabled={editing ? false : true}
                        onChange={(e) => {onCategoryChange(e.target.value, category.id)}}
                      />
                      <p className="category_entries">&#040;{category.photoCount}&#041;</p>
                    </li>
                  ))}
                </ul>
              </form>
            ) : (
              <>
                <p className="note_no-record-found">No category registered</p>
              </>
            )}
          </section>
          <div
            className={`add-categ_background ${addingNew ? 'visible_block' : ''}`}
            onClick={(e) => onOutsideModalClick(e)}
          >
            <div className={`add-category-modal ${addingNew ? 'visible_flex' : ''}`}>
              <h3 className="title_add-category">Add New Category</h3>
              <form className="form_add-category">
                <input
                  type='text'
                  id='category'
                  className="input input_new-category"
                  onChange={(e) => {setNewCategory(e.target.value)}}
                  placeholder="Please input category name"
                />
                <div className="new-category-btn-container">
                  <button
                    className="btn btn_new-category"
                    onClick={(e) => {onNewCategorySubmit(e)}}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn_cancel"
                    onClick={() => setAddingNew(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>}
      </main>
    </>
  )
}

export default Categories