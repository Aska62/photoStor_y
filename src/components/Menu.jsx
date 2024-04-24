import { Link, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { HOME_PAGE_URL, PHOTOS_PAGE_URL, CATEGORIES_PAGE_URL, PROFILE_PAGE_URL, LOGIN_PAGE_URL } from '../constants.js';
import { IoLogOutOutline } from "react-icons/io5";

const Menu = ({ onLogout, onMenuClick, hamburgerOpen }) => {
  const location = useLocation();
  const auth = getAuth();

  return (
    <nav className={`mob-menu ${hamburgerOpen ? 'mob-menu_open' : ''}`}>
      <div className={`mob-menu_link-container ${hamburgerOpen ? 'mob-menu_link-container_open' : ''}`}>
        <Link
          to={HOME_PAGE_URL}
          className={`nav-item nav-item_mob ${location.pathname === HOME_PAGE_URL ? 'nav-item_current' : ''}`}
          onClick={onMenuClick}
        >
          Home
        </Link>
        <Link
          to={PHOTOS_PAGE_URL}
          className={`nav-item nav-item_mob ${location.pathname === PHOTOS_PAGE_URL ? 'nav-item_current' : ''}`}
          onClick={onMenuClick}
        >
          Photos
        </Link>
        {auth.currentUser && <>
          <Link
            to={CATEGORIES_PAGE_URL}
            className={`nav-item nav-item_mob ${location.pathname === CATEGORIES_PAGE_URL ? 'nav-item_current' : ''}`}
            onClick={onMenuClick}
          >
            Categories
          </Link>
        </>}
        <Link
          to={PROFILE_PAGE_URL}
          className={`nav-item nav-item_mob ${location.pathname === PROFILE_PAGE_URL ? 'nav-item_current' : ''}`}
          onClick={onMenuClick}
        >
          Profile
        </Link>
        {auth.currentUser ? <>
          <IoLogOutOutline className="nav-item nav-item_mob nav-item_logout" onClick={onLogout} />
        </> : <>
          <Link
            to={LOGIN_PAGE_URL}
            className={`nav-item nav-item_mob ${location.pathname === LOGIN_PAGE_URL ? 'nav-item_current' : ''}`}
          >
            Login
          </Link>
        </>}
      </div>
    </nav>
  )
}

export default Menu