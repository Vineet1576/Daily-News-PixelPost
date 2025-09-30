import Blog from './Blog'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './Login'
import SignUp from './SignUp'
import Profile from './Profile'

function App() {
  return (
    <BrowserRouter>
      <nav style={{ background: 'rgba(26,34,43,0.92)', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
        <Link to="/profile" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Profile</Link>
        <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Blog />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
