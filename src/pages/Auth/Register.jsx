import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff } from "react-icons/lu";
import './Style/AuthStyle.css';
import { supabase } from '../../supabaseClient';


export default function Register() {
    const [showPass, setShowPass] = useState(false);
    const [checkPassword, setCheckPassword] = useState(null);
    const [error, setError] = useState(null);
    const [loading,setloading] = useState(null)
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
        setloading(true)
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const fullName = formData.get('username');
    
        if (password !== formData.get('confirmPassword')) {
            setCheckPassword(false);
            return;
        }
    
      
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    is_seller: false,
                }
            }
        });
      
        if (error) {
            setError(error.message);
        } else {
            navigate('/link-confirm');
        }
    }
    return (
        <div className="auth-page-wrapper">
            <div className="auth-logo-section">
                <div className="logo" style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#1a73e8'}}>Buyzen</div>
                <p>Shop Smart, Live Easy.</p>
            </div>

            <div className="auth-card">
                {error && <div className="auth-error-msg">{error}</div>}
                <h1>Hisob yaratish</h1>
                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label>To'liq ism</label>
                        <input type="text" name="username" placeholder="Ismingiz..." required pattern='[A-Za-z\s]+' title='Faqat harflar kiritilishi lozim!'/>
                    </div>

                    <div className="auth-form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="example@mail.com" required />
                    </div>

                    <div className="auth-form-group">
                        <label>Parol</label>
                        <div className="password-input-wrapper">
                            <input 
                                type={showPass ? "text" : "password"} 
                                name="password" 
                                placeholder="••••••••" 
                                pattern='^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$'
                                title='Parol kamida 8 ta belgi, bitta harf va bitta raqamdan iborat bolishi shart'
                                required 
                            />
                            <button type="button" className="eye-icon" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <LuEyeOff /> : <LuEye />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-form-group">
                        <label>Parolni tasdiqlang</label>
                        <div className="password-input-wrapper">
                            <input 
                                type={showPass ? "text" : "password"} 
                                name="confirmPassword" 
                                placeholder="••••••••" 
                                required 
                            />
                        </div>
                    </div>

                    {checkPassword === false && <div className="auth-error-msg">⚠ Parollar mos kelmadi!</div>}

                    <button type="submit" className="auth-submit-btn">Ro'yxatdan o'tish</button>
                    {loading ?<div className="textWrapper" style={{margin: "auto"}}>
                    <p className="text">Loading...</p>
                    <div className="invertbox"></div>
               </div>: null}
                    
                </form>

                <div className="auth-footer">
                    Akkauntingiz bormi? <Link to="/login" className="auth-link">Kirish</Link>
                </div>
            </div>
        </div>
    );
}
