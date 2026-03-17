import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    async function handleReset(e) {
        e.preventDefault();
        const email = new FormData(e.target).get('email');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:5173/update-password', 
        });

        if (error) {
            alert("Xatolik: " + error.message);
        } else {
            setMessage("Emailingizga parolni tiklash havolasi yuborildi!");
        }
    }

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card">
                <h1>Parolni tiklash</h1>
                {message ? <p>{message}</p> : (
                    <form onSubmit={handleReset}>
                        <div className="auth-form-group">
                            <label>Emailingizni kiriting</label>
                            <input type="email" name="email" required placeholder='Email' />
                        </div>
                        <button type="submit" className="auth-submit-btn">Havola yuborish</button>
                    </form>
                )}
                <div    className='auth-forgot-section'>
                    <button className='auth-forgot-section-escape-btn' style={{cursor: 'pointer'}} onClick={() => navigate(-1)}>Orqaga</button>
                </div>
            </div>
        </div>
    );
}