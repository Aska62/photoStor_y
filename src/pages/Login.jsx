import Header from "../components/Header";
import OAuth from "../components/OAuth";

const Login = ({ detectMobMenuOpen }) => {
  return (
    <div className="main main_login" onContextMenu={(e)=> e.preventDefault()}>
      <Header detectMobMenuOpen={detectMobMenuOpen} isLoginPage={true} />
      <h2 className="main-title main-title_top_login">Photo<br className='title-br' />Story</h2>
      <div className="login-box">
        <h3 className="page-title_login">Login</h3>
        <OAuth />
      </div>
      <p className="main-title main-title_bottom_login">Photo<br className='title-br' />Story</p>
    </div>
  )
}

export default Login