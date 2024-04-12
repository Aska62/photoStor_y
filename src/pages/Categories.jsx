import { useState, useEffect } from "react";
import { collection, doc, getDocs, query, where, addDoc, writeBatch, deleteDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase.config';
import { MdOutlineCancel } from "react-icons/md";
import Header from "../components/Header";

const Categories = ({ headerWhite }) => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState(false);
  const [nameAltered, setNameAltered] = useState(false);

  const auth = getAuth();

  const categRef = collection(db, 'categories');

  useEffect(()=> {
    fetchCategories();
  }, []);

  // Fetch all category of the user
  const fetchCategories = async () => {
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
          editedName: ''
        });
      });

      setCategories(fetchedCateg);
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
  const onDeleteCategory = (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete ${categoryName}?`)) return;

    deleteDoc(doc(db, "categories", categoryId))
      .then(() => {
        alert(`Deleted ${categoryName}`);
        fetchCategories();
      })
      .catch(() => {
        alert(`Failed to delete ${categoryName}`);
      })
  }

  return (
    <>
      <Header white={headerWhite} />
      <main className="main main_categories">
        {loading ? <p>Loading...</p> : <>
          <h2 className="page-title_categories">Categories</h2>
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
                  className={`btn btn_edit-categories ${editing ? 'btn_hidden' : ''}`}
                  onClick={() => setEditing(true)}
                  disabled={addingNew ? true : false}
                >
                  Edit
                </button>
                <button
                  type='button'
                  className={`btn btn_save-categories ${!editing ? 'btn_hidden' : ''}`}
                  onClick={onUpdate}
                >
                  Save
                </button>
                <button
                  type='button'
                  className={`btn btn_cancel btn_cancel-categories ${!editing ? 'btn_hidden' : ''}`}
                  onClick={onEditCancel}
                >
                  Cancel
                </button>
                <ul className="category-ul">
                  {categories.map((category) => (
                    <li className="category-li" key={category.id}>
                      <MdOutlineCancel
                        className={`categ-del-btn ${editing ? 'categ-del-btn_visible' : ''}`}
                        onClick={() => onDeleteCategory(category.id)}
                      />
                      <input
                        type='text'
                        name='category'
                        id={category.id}
                        value={category.editedName.length > 0 ? category.editedName : category.name}
                        className={`category-input ${editing ? 'category-input_editing' : ''}`}
                        disabled={editing ? false : true}
                        onChange={(e) => {onCategoryChange(e.target.value, category.id)}}
                      />
                    </li>
                  ))}
                </ul>
              </form>
            ) : (
              <>
                <p>No category registered</p>
              </>
            )}
          </section>
          <div className={`add-category-modal ${addingNew ? 'add-category-modal_visible' : ''}`}>
            <h3 className="title_add-category">Add New Category</h3>
            <form className="form_add-category">
              <input
                type='text'
                id='category'
                className="input input_category"
                onChange={(e) => {setNewCategory(e.target.value)}}
              />
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
            </form>
          </div>
        </>}
      </main>
    </>
  )
}

export default Categories