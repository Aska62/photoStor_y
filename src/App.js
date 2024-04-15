import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./pages/Login";
import Home from "./pages/Home";
import Photos from './pages/Photos';
import Photo from './pages/Photo';
import AddPhoto from './pages/AddPhoto';
import Categories from './pages/Categories';

function App() {
  return (
    <Router>
      <Routes >
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<PrivateRoute />} >
          <Route path='/' element={<Home headerWhite={false} />} />
        </Route>
        <Route path='/photos' element={<PrivateRoute />} >
          <Route path='/photos' element={<Photos headerWhite={true} />} />
          <Route path='/photos/view/:id' element={<Photo headerWhite={true} />} />
          <Route path='/photos/add' element={<AddPhoto headerWhite={true} />} />
        </Route>
        <Route path='/categories' element={<PrivateRoute />} >
          <Route path='/categories' element={<Categories headerWhite={true} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
