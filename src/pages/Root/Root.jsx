import { Outlet, NavLink, useNavigate, } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import logo from "../../assets/logo-old.png"; 
import "./Root.css";

export default function Root() {
  const navigate = useNavigate()

 async  function handleLogout(){
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login');
  }
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

       <button className="logout-button" onClick={handleLogout}>Log Out</button>

        <div className="user-actions">
       
        </div>
      </header>

      <main className="main-content">
        
        <Outlet />
      </main>
    </>
  );
}