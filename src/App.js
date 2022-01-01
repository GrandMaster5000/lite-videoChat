import Room from './pages/Room'; 
import Main from './pages/Main'; 
import NotFound404 from './pages/NotFound404'; 

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="room/:id/*" element={<Room />} />
        <Route path='*' element={<NotFound404/>}/>
      </Routes>
    </Router>
  );
}

export default App
