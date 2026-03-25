import { Outlet, NavLink } from "react-router-dom";

import logo from "../../assets/logo-old.png"; 
import "./Root.css";

export default function Root() {
  return (
    <>
      <header className="header">
        <div className="logo">
          <img className="logo-img" src={logo} alt="Buyzen Logo" />
        </div>

        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
            Home
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? "active" : ""}>
            Products
          </NavLink>
          <NavLink to="/basket" className={({ isActive }) => isActive ? "active" : ""}>
            Basket
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
            Profile
          </NavLink>
        </nav>

        <form className="search-form">
          <input type="text" className="search-input" placeholder="Qidirish..." />
        </form>

        <div className="user-actions">
          <button title="Savat"><i className="icon-cart"></i></button>
          <button title="Bildirishnomalar"><i className="icon-bell"></i></button>
        </div>
      </header>

      <main className="main-content">
        
        <Outlet />
      </main>
    </>
  );
}