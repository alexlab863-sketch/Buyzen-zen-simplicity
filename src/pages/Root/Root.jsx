import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import logo from "../../assets/logo-old.png"; 
import { supabase } from "../../supabaseClient";
import "./Root.css";

export default function Root() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(Boolean(session));
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/login");
  };

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

        <div className="user-actions">
          {isLoggedIn ? (
            <button type="button" className="header-logout-btn" onClick={handleLogout}>
              Chiqish
            </button>
          ) : null}
        </div>
      </header>

      <main className="main-content">
        
        <Outlet />
      </main>
    </>
  );
}
