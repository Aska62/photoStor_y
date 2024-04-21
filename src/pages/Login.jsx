import OAuth from "../components/OAuth";

const Login = () => {
  return (
    <main className="main main_login">
      <h2 className="main-title main-title_top_login">Photo<br className='title-br' />Story</h2>
      <div className="login-box">
        <h3 className="page-title_login">Login</h3>
        <OAuth />
      </div>
      <p className="main-title main-title_bottom_login">Photo<br className='title-br' />Story</p>
    </main>
  )
}

export default Login