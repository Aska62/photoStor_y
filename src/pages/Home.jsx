import Header from "../components/Header"

const Home = ({ detectMobMenuOpen, isMobMenuOpen }) => {
  return (
    <>
      <Header detectMobMenuOpen={detectMobMenuOpen} />
      <main className={`main main_home ${isMobMenuOpen ? 'main_frozen' : ''}`}>
        <h2 className="main-title main-title_top_home">Photo<br className='title-br' />Story</h2>
        <div className="main-image main-image_home">
          <div className="main-image-cover" onContextMenu={(e)=> e.preventDefault()}></div>
        </div>
        <p className="main-title main-title_bottom_home">Photo<br className='title-br' />Story</p>
      </main>
    </>
  )
}

export default Home