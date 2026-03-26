import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { adaptiveUpsert, isMissingSchemaError, isRlsError } from '../../utils/supabaseAdaptive';
import './Profile.css';

const INITIAL_FORM = {
  shop_name: '',
  phone: '',
  description: '',
};

export default function SellerForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closingShop, setClosingShop] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userId, setUserId] = useState('');
  const [userMetadata, setUserMetadata] = useState({});
  const [sellerStore, setSellerStore] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setStatus({ type: 'error', text: error.message });
        setLoading(false);
        return;
      }

      const user = session?.user;

      if (!user) {
        navigate('/login');
        return;
      }

      const metadata = user.user_metadata || {};
      const sellerProfile = metadata.seller_profile || {};
      const sellerSources = [
        { table: 'sellers', key: 'user_id' },
        { table: 'sellers', key: 'id' },
        { table: 'seller_profiles', key: 'user_id' },
        { table: 'seller_profiles', key: 'id' },
      ];

      let sellerData = null;
      let matchedSellerSource = null;

      for (const source of sellerSources) {
        const { data, error: sellerError } = await supabase
          .from(source.table)
          .select('*')
          .eq(source.key, user.id)
          .maybeSingle();

        if (sellerError) {
          if (isMissingSchemaError(sellerError) || isRlsError(sellerError)) {
            continue;
          }
          setStatus({ type: 'error', text: sellerError.message });
          break;
        }

        if (data) {
          sellerData = data;
          matchedSellerSource = source;
          break;
        }
      }

      setUserId(user.id);
      setUserMetadata(metadata);
      setIsSeller(Boolean(metadata.is_seller || metadata.role === 'seller' || sellerData));
      setSellerStore(matchedSellerSource);
      setForm({
        shop_name: sellerData?.shop_name || sellerData?.store_name || sellerProfile.shop_name || '',
        phone:
          sellerData?.phone ||
          sellerData?.phone_number ||
          metadata.phone ||
          sellerProfile.phone ||
          '',
        description:
          sellerData?.description ||
          sellerData?.bio ||
          sellerData?.about ||
          sellerProfile.description ||
          metadata.bio ||
          '',
      });
      setLoading(false);
    };

    loadUser();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) return;

    const trimmed = {
      shop_name: form.shop_name.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
    };

    if (!trimmed.shop_name || !trimmed.phone || !trimmed.description) {
      setStatus({ type: 'error', text: "Iltimos, barcha maydonlarni to'ldiring." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', text: '' });

    const sellerData = {
      ...userMetadata,
      is_seller: true,
      role: 'seller',
      phone: trimmed.phone,
      seller_profile: {
        shop_name: trimmed.shop_name,
        phone: trimmed.phone,
        description: trimmed.description,
      },
      seller_joined_at: new Date().toISOString(),
    };

    const { error: authError } = await supabase.auth.updateUser({
      data: sellerData,
    });

    if (authError) {
      setSubmitting(false);
      setStatus({ type: 'error', text: authError.message });
      return;
    }

    const sellerSources = sellerStore
      ? [
          sellerStore,
          { table: 'sellers', key: 'user_id' },
          { table: 'sellers', key: 'id' },
          { table: 'seller_profiles', key: 'user_id' },
          { table: 'seller_profiles', key: 'id' },
          { table: 'seller_requests', key: 'user_id' },
          { table: 'seller_requests', key: 'id' },
        ]
      : [
          { table: 'sellers', key: 'user_id' },
          { table: 'sellers', key: 'id' },
          { table: 'seller_profiles', key: 'user_id' },
          { table: 'seller_profiles', key: 'id' },
          { table: 'seller_requests', key: 'user_id' },
          { table: 'seller_requests', key: 'id' },
        ];

    let sellerSaved = false;
    let lastSellerError = null;

    for (const source of sellerSources) {
      const row = {
        [source.key]: userId,
        shop_name: trimmed.shop_name,
        store_name: trimmed.shop_name,
        phone: trimmed.phone,
        phone_number: trimmed.phone,
        description: trimmed.description,
        bio: trimmed.description,
        about: trimmed.description,
        status: 'approved',
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const result = await adaptiveUpsert(supabase, source.table, source.key, row);
      if (result.ok) {
        sellerSaved = true;
        setSellerStore(source);
        lastSellerError = null;
        break;
      }

      if (isMissingSchemaError(result.error) || isRlsError(result.error)) {
        continue;
      }

      lastSellerError = result.error;
      break;
    }

    if (!sellerSaved) {
      const profileSources = [
        { table: 'profiles', key: 'id' },
        { table: 'profiles', key: 'user_id' },
        { table: 'users', key: 'id' },
        { table: 'users', key: 'user_id' },
        { table: 'user_profiles', key: 'id' },
        { table: 'user_profiles', key: 'user_id' },
      ];

      for (const source of profileSources) {
        const row = {
          [source.key]: userId,
          phone: trimmed.phone,
          bio: trimmed.description,
          is_seller: true,
          role: 'seller',
          updated_at: new Date().toISOString(),
        };

        const result = await adaptiveUpsert(supabase, source.table, source.key, row);
        if (result.ok) {
          sellerSaved = true;
          lastSellerError = null;
          break;
        }

        if (isMissingSchemaError(result.error) || isRlsError(result.error)) {
          continue;
        }

        lastSellerError = result.error;
        break;
      }
    }

    if (lastSellerError) {
      setSubmitting(false);
      setStatus({ type: 'error', text: lastSellerError.message });
      return;
    }

    setSubmitting(false);
    setIsSeller(true);
    setStatus({
      type: 'success',
      text: "Tabriklaymiz! Sizning akkauntingiz seller statusga o'tdi.",
    });
  };

  const handleCloseShop = async () => {
    if (!userId) return;

    setClosingShop(true);
    setStatus({ type: '', text: '' });

    const updatedMetadata = {
      ...userMetadata,
      is_seller: false,
      role: 'user',
      seller_closed_at: new Date().toISOString(),
    };

    const { error: authError } = await supabase.auth.updateUser({
      data: updatedMetadata,
    });

    if (authError) {
      setClosingShop(false);
      setStatus({ type: 'error', text: authError.message });
      return;
    }

    const sellerSources = sellerStore
      ? [
          sellerStore,
          { table: 'sellers', key: 'user_id' },
          { table: 'sellers', key: 'id' },
          { table: 'seller_profiles', key: 'user_id' },
          { table: 'seller_profiles', key: 'id' },
          { table: 'seller_requests', key: 'user_id' },
          { table: 'seller_requests', key: 'id' },
        ]
      : [
          { table: 'sellers', key: 'user_id' },
          { table: 'sellers', key: 'id' },
          { table: 'seller_profiles', key: 'user_id' },
          { table: 'seller_profiles', key: 'id' },
          { table: 'seller_requests', key: 'user_id' },
          { table: 'seller_requests', key: 'id' },
        ];

    let closeError = null;

    for (const source of sellerSources) {
      const row = {
        [source.key]: userId,
        is_active: false,
        is_seller: false,
        status: 'closed',
        role: 'user',
        updated_at: new Date().toISOString(),
      };

      const result = await adaptiveUpsert(supabase, source.table, source.key, row);
      if (result.ok) {
        closeError = null;
        break;
      }

      if (isMissingSchemaError(result.error) || isRlsError(result.error)) {
        continue;
      }

      closeError = result.error;
      break;
    }

    if (closeError) {
      setClosingShop(false);
      setStatus({ type: 'error', text: closeError.message });
      return;
    }

    setUserMetadata(updatedMetadata);
    setIsSeller(false);
    setClosingShop(false);
    setStatus({ type: 'success', text: "Do'kon yopildi. Hisobingiz oddiy user holatiga qaytdi." });
  };

  if (loading) {
    return <p className="loading">Sotuvchi profili yuklanmoqda...</p>;
  }

  return (
    <div className="profile-wrapper seller-page-wrapper">
      <section className="seller-layout">
        <article className="seller-hero-card">
          <span className="seller-chip">Buyzen Seller</span>
          <h1 className="seller-title">Do'koningizni bugunoq ishga tushiring</h1>
          <p className="seller-subtitle">
            Seller hisobga o&apos;tib, mahsulotlaringizni joylashtiring va ko&apos;proq
            mijozlarga tezroq chiqing.
          </p>

          <div className="seller-benefits">
            <p>Cheksiz mahsulot joylash imkoniyati</p>
            <p>Buyurtmalarni bir joydan boshqarish</p>
            <p>Profilingizda seller belgisi</p>
          </div>
        </article>

        <article className="seller-form-card">
          <div className="seller-form-head">
            <h2>Seller arizasi</h2>
            <p>Qisqa ma&apos;lumot qoldiring, akkauntingiz seller holatiga o&apos;tadi.</p>
          </div>

          {isSeller ? (
            <div className="seller-success-box">
              Siz allaqachon seller hisobdasiz. Endi mahsulotlaringizni qo&apos;shishni boshlashingiz
              mumkin.
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="profile-btn profile-logout-btn"
                  onClick={handleCloseShop}
                  disabled={closingShop}
                >
                  {closingShop ? "Yopilmoqda..." : "Do'konni yopish"}
                </button>
              </div>
            </div>
          ) : (
            <form className="seller-form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="shop_name"
                className="profile-input"
                placeholder="Do'kon nomi"
                value={form.shop_name}
                onChange={handleChange}
                required
              />

              <input
                type="tel"
                name="phone"
                className="profile-input"
                placeholder="Telefon raqam"
                value={form.phone}
                onChange={handleChange}
                required
              />

              <textarea
                name="description"
                className="profile-textarea"
                placeholder="Do'koningiz haqida qisqacha ma'lumot"
                value={form.description}
                onChange={handleChange}
                required
              />

              {status.text && (
                <p className={`profile-status ${status.type === 'error' ? 'error' : 'success'}`}>
                  {status.text}
                </p>
              )}

              <button className="profile-btn seller-submit-btn" type="submit" disabled={submitting}>
                {submitting ? 'Yuborilmoqda...' : "Seller bo'lish"}
              </button>
            </form>
          )}

          <Link to="/profile" className="seller-back-link">
            Profilga qaytish
          </Link>
        </article>
      </section>
    </div>
  );
}
