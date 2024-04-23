import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./pages/Login";
import Home from "./pages/Home";
import Photos from './pages/Photos';
import Photo from './pages/Photo';
import AddPhoto from './pages/AddPhoto';
import Categories from './pages/Categories';
import Profile from './pages/Profile';

function App() {
  const [isMobMenuOpen, setIsMobMenuOpen] = useState(false);

  const detectMobMenuOpen = (isMenuOpen) => {
    setIsMobMenuOpen(isMenuOpen);
  }

  return (
    <Router>
      <Routes >
        <Route path='/' element={<Home detectMobMenuOpen={detectMobMenuOpen} isMobMenuOpen={isMobMenuOpen} />} />
        <Route path='/login' element={<Login detectMobMenuOpen={detectMobMenuOpen} isMobMenuOpen={isMobMenuOpen} />} />
        <Route path='/photos' element={<Photos detectMobMenuOpen={detectMobMenuOpen} isMobMenuOpen={isMobMenuOpen} />} />
        <Route path='/photos/view/:id' element={<Photo detectMobMenuOpen={detectMobMenuOpen} isMobMenuOpen={isMobMenuOpen} />} />
        <Route path='/photos' element={<PrivateRoute />} >
          <Route path='/photos/add' element={<AddPhoto detectMobMenuOpen={detectMobMenuOpen} isMobMenuOpen={isMobMenuOpen}/>} />
        </Route>
        <Route path='/categories' element={<PrivateRoute />} >
          <Route path='/categories' element={<Categories detectMobMenuOpen={detectMobMenuOpen} isMobMenuOpen={isMobMenuOpen} />} />
        </Route>
        <Route path='/profile' element={<Profile detectMobMenuOpen={detectMobMenuOpen} isMobMenuOpen={isMobMenuOpen} />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
