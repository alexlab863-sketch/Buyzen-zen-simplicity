import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Profile.css';

export default function SellerForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ shop_name: '', phone: '', description: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const userId = session.user.id;

    try {
      // 1. Sellers jadvaliga yozish
      const { error } = await supabase.from('sellers').upsert({
        id: userId, // PK sifatida user id-si
        shop_name: form.shop_name,
        contact_phone: form.phone,
        description: form.description,
        is_seller: true,
        status: 'active'
      });

      if (error) throw error;

      // 2. Auth metadatasini yangilash (navigatsiya uchun qulay)
      await supabase.auth.updateUser({
        data: { is_seller: true, role: 'seller' }
      });

      setStatus({ type: 'success', text: "Tabriklaymiz! Endi siz sotuvchisiz." });
      setTimeout(() => navigate('/profile/add-product'), 1500);
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <form onSubmit={handleSubmit} className="seller-form card">
        <h1>Sotuvchi sifatida ro'yxatdan o'tish</h1>
        <input placeholder="Do'koningiz nomi" className="profile-input" 
          onChange={e => setForm({...form, shop_name: e.target.value})} required />
        <input placeholder="Telefon raqamingiz" className="profile-input" 
          onChange={e => setForm({...form, phone: e.target.value})} required />
        <textarea placeholder="Do'kon haqida qisqacha" className="profile-textarea" 
          onChange={e => setForm({...form, description: e.target.value})} required />
        
        {status.text && <p className={`profile-status ${status.type}`}>{status.text}</p>}
        
        <button type="submit" disabled={submitting} className="profile-btn">
          {submitting ? "Yuborilmoqda..." : "Sotuvchi bo'lish"}
        </button>
        <Link to="/profile" className="seller-back-link">Orqaga</Link>
      </form>
    </div>
  );
}