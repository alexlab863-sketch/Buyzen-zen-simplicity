import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { LuEye, LuEyeOff } from "react-icons/lu";
import "./Style/AuthStyle.css";

export default function UpdatePassword() {
    const [showPass, setShowPass] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    async function handleUpdate(e) {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Parollar mos emas!");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            alert("Xatolik: " + error.message);
        } else {
            setError("Parol muvaffaqiyatli yangilandi!");
            navigate('/login');
        }
        setLoading(false);
    }

    return (
        <div className="auth-page-wrapper">
            <button className="back-btn" onClick={() => navigate(-1)}>
        <span className="back-icon">←</span> ORQAGA
      </button>
            <div className="auth-logo-section">
                <div className="logo" style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#1a73e8'}}>Buyzen</div>
                <p className="slogan">Shop Smart, Live Easy.</p>
            </div>
           {error && <div className="auth-error-msg">{error}</div>}
            <div className="auth-card">
                <h1>Yangi parol</h1>
                <p style={{color: '#667', marginBottom: '20px', fontSize: '0.9rem'}}>
                    Iltimos, eslab qolish oson bo'lgan xavfsiz parol kiriting.
                </p>

                <form onSubmit={handleUpdate}>
                    <div className="auth-form-group">
                        <label>Yangi parol</label>
                        <div className="password-input-wrapper">
                            <input 
                                type={showPass ? "text" : "password"} 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            <button type="button" className="eye-icon" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <LuEyeOff /> : <LuEye />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-form-group">
                        <label>Parolni tasdiqlang</label>
                        <input 
                            type={showPass ? "text" : "password"} 
                            placeholder="••••••••" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required 
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? "Yangilanmoqda..." : "Parolni saqlash"}
                    </button>
                </form>
            </div>
        </div>
    );
}