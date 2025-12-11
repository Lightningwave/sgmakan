import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import PlaceDetails from './pages/PlaceDetails';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Router>
      <div className="App">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="app-container">
          <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
          {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/place/:id" element={<PlaceDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
            <Footer />
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
