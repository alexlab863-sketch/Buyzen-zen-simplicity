import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuEye, LuEyeOff } from "react-icons/lu"; 
import './Style/AuthStyle.css';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/'); 
            }
        };
        checkUser();
    }, [navigate]);



    async function handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.get('email'),
            password: formData.get('password'),
        });
    
        if (error) {
            setError(error.message);
        } else {
            navigate('/'); 
        }
    }
    return (
        <div className="auth-page-wrapper">
            <div className="auth-logo-section">
                <div className="logo" style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#1a73e8'}}>Buyzen</div>
                <p className="slogan">Shop Smart, Live Easy.</p>
            </div>

            <div className="auth-card">
                {error && <div className="auth-error-msg">{error}</div>}
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="Email" required />
                    </div>

                    <div className="auth-form-group">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                placeholder="Password" 
                                required 
                            />
                            <button 
                                type="button" 
                                className="eye-icon" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <LuEyeOff /> : <LuEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn">Kirish</button>

                    <div className="auth-footer">
                        <Link to="/forgot-password" className="auth-link">Parolni unutdingizmi?</Link>
                        <div style={{marginTop: '15px'}}>
                            Ro'yhatdan o'tmaganisiz? <Link to="/register" className="auth-link">Ro'yhatdan O'tish</Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}