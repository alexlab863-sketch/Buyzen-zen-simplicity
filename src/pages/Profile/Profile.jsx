import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Profile.css';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  bio: '',
  avatar_url: '',
};

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [hasProfilesTable, setHasProfilesTable] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setStatus({ type: 'error', text: sessionError.message });
        setLoading(false);
        return;
      }

      const user = session?.user;

      if (!user) {
        navigate('/login');
        return;
      }

      setEmail(user.email || '');
      setUserId(user.id);

      const metadata = user.user_metadata || {};
      const mergedForm = {
        full_name: metadata.full_name || '',
        phone: metadata.phone || '',
        bio: metadata.bio || '',
        avatar_url: metadata.avatar_url || '',
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, bio, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        if (profileError.code === '42P01') {
          setHasProfilesTable(false);
          setStatus({
            type: 'error',
            text: 'profiles jadvali topilmadi. Hozircha faqat auth metadata saqlanadi.',
          });
        } else {
          setStatus({ type: 'error', text: profileError.message });
        }
      }

      if (profileData) {
        setForm({
          full_name: profileData.full_name || mergedForm.full_name,
          phone: profileData.phone || mergedForm.phone,
          bio: profileData.bio || mergedForm.bio,
          avatar_url: profileData.avatar_url || mergedForm.avatar_url,
        });
      } else {
        setForm(mergedForm);
      }

      setLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setStatus({ type: '', text: '' });

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
      avatar_url: form.avatar_url.trim(),
    };

    if (hasProfilesTable) {
      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        if (upsertError.code === '42P01') {
          setHasProfilesTable(false);
        } else {
          setSaving(false);
          setStatus({ type: 'error', text: upsertError.message });
          return;
        }
      }
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: payload,
    });

    if (authUpdateError) {
      setSaving(false);
      setStatus({ type: 'error', text: authUpdateError.message });
      return;
    }

    setSaving(false);
    setStatus({ type: 'success', text: "Ma'lumotlar muvaffaqiyatli saqlandi." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <p className="loading">Profil yuklanmoqda...</p>;
  }

  const avatarPreview = form.avatar_url?.trim();

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <h1 className="profile-title">Mening Profilim</h1>
        <p className="profile-email">{email}</p>

        {avatarPreview ? (
          <img src={avatarPreview} alt="Profile avatar" className="profile-avatar" />
        ) : (
          <div className="profile-avatar profile-avatar-placeholder">
            {form.full_name?.trim()?.[0]?.toUpperCase() || 'U'}
          </div>
        )}

        <form onSubmit={handleSave}>
          <input
            type="text"
            name="full_name"
            className="profile-input"
            placeholder="To'liq ism"
            value={form.full_name}
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
          />

          <input
            type="url"
            name="avatar_url"
            className="profile-input"
            placeholder="Avatar URL"
            value={form.avatar_url}
            onChange={handleChange}
          />

          <textarea
            name="bio"
            className="profile-textarea"
            placeholder="O'zingiz haqingizda"
            value={form.bio}
            onChange={handleChange}
          />

          {status.text && (
            <p className={`profile-status ${status.type === 'error' ? 'error' : 'success'}`}>
              {status.text}
            </p>
          )}

          <button type="submit" className="profile-btn" disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>

        <Link to="/update-password" className="profile-link-btn">
          Parolni yangilash
        </Link>

        <button onClick={handleLogout} className="profile-btn profile-logout-btn" type="button">
          Chiqish
        </button>
      </div>
    </div>
  );
}
