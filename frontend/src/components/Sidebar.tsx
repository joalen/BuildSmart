import { NavLink, useNavigate } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { label: 'Home', path: '/home', icon: '🏠' },
  { label: 'Plan',  path: '/plan',  icon: '✏️' },
  { label: 'Cost',  path: '/cost',  icon: '📋' },
  { label: 'Cart',  path: '/cart',  icon: '🛒' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">BuildSmart</div>
      <nav className="sidebar-nav">
        {navItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="new-project-btn" onClick={() => navigate('/plan')}>
          + New Project
        </button>
        <button className="logout-btn">↩ Log out</button>
      </div>
    </aside>
  )
}