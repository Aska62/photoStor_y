import Header from "../components/Header"

const Home = ({ headerWhite }) => {
  return (
    <>
      <Header headerWhite={headerWhite} />
      <main className="main main_home">
        <h1 className="main-title main-title_top">PhotoStory</h1>
        <div className="main-image">
          <div className="main-image-cover"></div>
        </div>
        <p className="main-title main-title_bottom">PhotoStory</p>
      </main>
    </>
  )
}

export default Home