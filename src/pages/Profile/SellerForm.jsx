import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Profile.css';

export default function SellerForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [checkingSeller, setCheckingSeller] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [sellerRecord, setSellerRecord] = useState(null);
  const [form, setForm] = useState({ shop_name: '', phone: '', description: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    const checkSellerStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      const user = session.user;
      const sellerFromMeta = Boolean(
        user.user_metadata?.is_seller || user.user_metadata?.role === 'seller'
      );

      const { data: sellerData, error } = await supabase
        .from('sellers')
        .select('id, shop_name, contact_phone, description, is_seller, status')
        .eq('id', user.id)
        .maybeSingle();

      const sellerFromTable = !error && sellerData
        ? Boolean(sellerData.is_seller || sellerData.status === 'active')
        : false;

      if (sellerData) {
        setSellerRecord(sellerData);
        setForm({
          shop_name: sellerData.shop_name || '',
          phone: sellerData.contact_phone || '',
          description: sellerData.description || '',
        });
      }

      setIsSeller(sellerFromMeta || sellerFromTable);
      setCheckingSeller(false);
    };

    checkSellerStatus();
  }, [navigate]);

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

      setIsSeller(true);
      setSellerRecord({
        id: userId,
        shop_name: form.shop_name,
        contact_phone: form.phone,
        description: form.description,
        is_seller: true,
        status: 'active',
      });
      setStatus({ type: 'success', text: "Tabriklaymiz! Endi siz sotuvchisiz." });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShop = async () => {
    const confirmed = window.confirm("Do'konni yopmoqchimisiz? Siz oddiy foydalanuvchiga aylanasiz.");
    if (!confirmed) return;

    setSubmitting(true);
    setStatus({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const userId = session.user.id;

      const { error: sellerError } = await supabase
        .from('sellers')
        .upsert({
          id: userId,
          shop_name: sellerRecord?.shop_name || form.shop_name || '',
          contact_phone: sellerRecord?.contact_phone || form.phone || '',
          description: sellerRecord?.description || form.description || '',
          is_seller: false,
          status: 'inactive',
        });

      if (sellerError) throw sellerError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { is_seller: false, role: 'user' }
      });

      if (authError) throw authError;

      setIsSeller(false);
      setSellerRecord(null);
      setStatus({ type: 'success', text: "Do'kon yopildi. Endi siz oddiy foydalanuvchisiz." });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSeller) {
    return (
      <div className="textWrapper" style={{ margin: 'auto' }}>
        <p className="text">Loading...</p>
        <div className="invertbox"></div>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      <div className="seller-layout">
        <article className="seller-hero-card">
          <span className="seller-chip">Seller Center</span>
          <h1 className="seller-title">
            {isSeller ? "Do'koningizni boshqaring" : "Sotuvchi sifatida ro'yxatdan o'ting"}
          </h1>
          <p className="seller-subtitle">
            {isSeller
              ? "Bu yerda seller holatingizni ko'rishingiz va kerak bo'lsa do'konni yopishingiz mumkin."
              : "Do'koningizni oching va Buyzen ichida mahsulotlaringizni sotishni boshlang."}
          </p>
        </article>

        <div className="seller-form card seller-manage-card">
          {isSeller ? (
            <>
              <div className="seller-form-head">
                <h2>Do'kon ma'lumotlari</h2>
                <p>Seller profilingiz faol. Quyida joriy ma'lumotlar ko'rsatilgan.</p>
              </div>

              <div className="seller-info-list">
                <div className="seller-info-item">
                  <span>Do'kon nomi</span>
                  <strong>{sellerRecord?.shop_name || form.shop_name || "Kiritilmagan"}</strong>
                </div>
                <div className="seller-info-item">
                  <span>Telefon</span>
                  <strong>{sellerRecord?.contact_phone || form.phone || "Kiritilmagan"}</strong>
                </div>
                <div className="seller-info-item seller-info-item-full">
                  <span>Tavsif</span>
                  <strong>{sellerRecord?.description || form.description || "Kiritilmagan"}</strong>
                </div>
              </div>

              {status.text && <p className={`profile-status ${status.type}`}>{status.text}</p>}

              <div className="seller-action-row">
                <Link to="/profile/add-product" className="profile-btn seller-action-btn">
                  Mahsulot qo'shish
                </Link>
                <button type="button" disabled={submitting} className="profile-btn profile-logout-btn seller-action-btn" onClick={handleCloseShop}>
                  {submitting ? "Yopilmoqda..." : "Do'konni yopish"}
                </button>
              </div>
              <Link to="/profile" className="seller-back-link">Orqaga</Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="seller-form">
              <h1>Sotuvchi sifatida ro'yxatdan o'tish</h1>
              <input
                placeholder="Do'koningiz nomi"
                className="profile-input"
                value={form.shop_name}
                onChange={e => setForm({...form, shop_name: e.target.value})}
                required
              />
              <input
                placeholder="Telefon raqamingiz"
                className="profile-input"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                required
              />
              <textarea
                placeholder="Do'kon haqida qisqacha"
                className="profile-textarea"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                required
              />

              {status.text && <p className={`profile-status ${status.type}`}>{status.text}</p>}

              <button type="submit" disabled={submitting} className="profile-btn">
                {submitting ? "Yuborilmoqda..." : "Sotuvchi bo'lish"}
              </button>
              <Link to="/profile" className="seller-back-link">Orqaga</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
