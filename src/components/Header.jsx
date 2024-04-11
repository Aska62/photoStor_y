import { useState } from "react";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { HOME_PAGE_URL, PHOTOS_PAGE_URL, CATEGORIES_PAGE_URL } from '../constants.js';
import { IoLogOutOutline } from "react-icons/io5";

const Header = ({ white }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const onLogout = () => {
    auth.signOut();
    navigate('/login');
  }

  return (
    <header className={white ? 'header_white' : ''}>
      <div className="header-app-title">PhotoStory</div>
      <div className="hamburger-container" onClick={()=>setHamburgerOpen(!hamburgerOpen)}>
        <div className={`hamburger-line hamburger-line_top ${hamburgerOpen ? 'hamburger-line_top_open' : ''}`}></div>
        <div className={`hamburger-line hamburger-line_middle ${hamburgerOpen ? 'hamburger-line_middle_open' : ''}`}></div>
        <div className={`hamburger-line hamburger-line_bottom ${hamburgerOpen ? 'hamburger-line_bottom_open' : ''}`}></div>
      </div>
      <nav className="navbar">
        <Link
          to={HOME_PAGE_URL}
          className={`nav-item ${location.pathname === HOME_PAGE_URL ? 'nav-item_current' : ''}`}
        >Home</Link>
        <Link
          to={PHOTOS_PAGE_URL}
          className={`nav-item ${location.pathname === PHOTOS_PAGE_URL ? 'nav-item_current' : ''}`}
        >Photos</Link>
        <Link
          to={CATEGORIES_PAGE_URL}
          className={`nav-item ${location.pathname === CATEGORIES_PAGE_URL ? 'nav-item_current' : ''}`}
        >Categories</Link>
        <IoLogOutOutline className="nav-item nav-item_logout" onClick={onLogout} />
      </nav>
    </header>
  )
}

export default Header