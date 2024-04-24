import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { PHOTOS_PAGE_URL, CATEGORIES_PAGE_URL, PROFILE_PAGE_URL, LOGIN_PAGE_URL } from '../constants.js';
import Header from "../components/Header";


const Home = ({ detectMobMenuOpen, isMobMenuOpen }) => {
  const auth = getAuth();

  return (
    <>
      <Header detectMobMenuOpen={detectMobMenuOpen} />
      <main className={`main main_home ${isMobMenuOpen ? 'main_frozen' : ''}`}>
        <h2 className="main-title main-title_top_home">Photo<br className='title-br' />Story</h2>
        <div className="main-image main-image_home">
          <div className="main-image-cover" onContextMenu={(e)=> e.preventDefault()}>
            <nav className='home-nav'>
              <Link to={PHOTOS_PAGE_URL} className='link home-navlink'>Photos</Link>
              {auth.currentUser && <Link to={CATEGORIES_PAGE_URL} className='link home-navlink'>Categories</Link>}
              <Link to={PROFILE_PAGE_URL} className='link home-navlink'>Profile</Link>
              {!auth.currentUser && <Link to={LOGIN_PAGE_URL} className='link home-navlink'>Login</Link>}
            </nav>
          </div>
        </div>
        <p className="main-title main-title_bottom_home">Photo<br className='title-br' />Story</p>
      </main>
    </>
  )
}

export default Home