import { useState } from "react";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import { HOME_PAGE_URL, PHOTOS_PAGE_URL, CATEGORIES_PAGE_URL, PROFILE_PAGE_URL, LOGIN_PAGE_URL } from '../constants.js';
import { IoLogOutOutline } from "react-icons/io5";
import Menu from "./Menu";

const Header = ({detectMobMenuOpen}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const onLogout = () => {
    auth.signOut();
    navigate('/login');
    toast.success('Signed out');
  }

  const onHamburgerClick = () => {
    setHamburgerOpen(!hamburgerOpen);
    detectMobMenuOpen(!hamburgerOpen);
  }

  return (
    <header className={hamburgerOpen ? 'header_menu-open' : ''}>
      <Link to={HOME_PAGE_URL} className="link link-header">
        <h1 className="header-app-title">PhotoStory</h1>
      </Link>
      <div
        className="hamburger-container"
        onClick={onHamburgerClick}
      >
        <div className={`hamburger-line hamburger-line_top ${hamburgerOpen ? 'hamburger-line_top_open' : ''}`}></div>
        <div className={`hamburger-line hamburger-line_middle ${hamburgerOpen ? 'hamburger-line_middle_open' : ''}`}></div>
        <div className={`hamburger-line hamburger-line_bottom ${hamburgerOpen ? 'hamburger-line_bottom_open' : ''}`}></div>
      </div>
      <nav className='navbar'>
        <Link
          to={HOME_PAGE_URL}
          className={`nav-item ${location.pathname === HOME_PAGE_URL ? 'nav-item_current' : ''}`}
        >
          Home
        </Link>
        <Link
          to={PHOTOS_PAGE_URL}
          className={`nav-item ${location.pathname === PHOTOS_PAGE_URL ? 'nav-item_current' : ''}`}
        >
          Photos
        </Link>
        {auth.currentUser && <>
          <Link
            to={CATEGORIES_PAGE_URL}
            className={`nav-item ${location.pathname === CATEGORIES_PAGE_URL ? 'nav-item_current' : ''}`}
          >
            Categories
          </Link>
        </>}
        <Link
          to={PROFILE_PAGE_URL}
          className={`nav-item ${location.pathname === PROFILE_PAGE_URL ? 'nav-item_current' : ''}`}
        >
          Profile
        </Link>
        {auth.currentUser ? <>
          <IoLogOutOutline className="nav-item nav-item_logout" onClick={onLogout} />
        </> : <>
          <Link
            to={LOGIN_PAGE_URL}
            className={`nav-item ${location.pathname === LOGIN_PAGE_URL ? 'nav-item_current' : ''}`}
          >
            Login
          </Link>
        </>}
      </nav>
        <Menu onLogout={onLogout} onMenuClick={onHamburgerClick} hamburgerOpen={hamburgerOpen} />
    </header>
  )
}

export default Header