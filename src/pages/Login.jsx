import OAuth from "../components/OAuth";

const Login = () => {
  return (
    <main className="main main_login">
      <h2 className="main-title main-title_top main-title_top_login">PhotoStory</h2>
      <div className="login-box">
        <h3 className="page-title page-title_login">Login</h3>
        <OAuth />
      </div>
      <p className="main-title main-title_bottom main-title_bottom_login">PhotoStory</p>
    </main>
  )
}

export default Login