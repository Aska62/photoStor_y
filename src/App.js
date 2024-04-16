import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./pages/Login";
import Home from "./pages/Home";
import Photos from './pages/Photos';
import Photo from './pages/Photo';
import AddPhoto from './pages/AddPhoto';
import Categories from './pages/Categories';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes >
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<PrivateRoute />} >
          <Route path='/' element={<Home />} />
        </Route>
        <Route path='/photos' element={<PrivateRoute />} >
          <Route path='/photos' element={<Photos />} />
          <Route path='/photos/view/:id' element={<Photo />} />
          <Route path='/photos/add' element={<AddPhoto />} />
        </Route>
        <Route path='/categories' element={<PrivateRoute />} >
          <Route path='/categories' element={<Categories />} />
        </Route>
        <Route path='/profile' element={<PrivateRoute />} >
          <Route path='/profile' element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
