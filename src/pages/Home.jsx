import Header from "../components/Header"

const Home = () => {
  return (
    <>
      <Header />
      <main className="main main_home">
        <h2 className="main-title main-title_top">PhotoStory</h2>
        <div className="main-image main-image_home">
          <div className="main-image-cover"></div>
        </div>
        <p className="main-title main-title_bottom">PhotoStory</p>
      </main>
    </>
  )
}

export default Home