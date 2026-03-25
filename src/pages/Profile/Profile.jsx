import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { adaptiveUpsert, isMissingSchemaError, isRlsError } from '../../utils/supabaseAdaptive';
import './Profile.css';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  bio: '',
  avatar_url: '',
};

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [profileStore, setProfileStore] = useState(null);

  const profileSources = useMemo(
    () => [
      { table: 'profiles', key: 'id' },
      { table: 'profiles', key: 'user_id' },
      { table: 'users', key: 'id' },
      { table: 'users', key: 'user_id' },
      { table: 'user_profiles', key: 'id' },
      { table: 'user_profiles', key: 'user_id' },
    ],
    []
  );

  const profileCompletion = useMemo(() => {
    const fields = [form.full_name, form.phone, form.bio, form.avatar_url];
    const filledCount = fields.filter((value) => value.trim()).length;
    return Math.round((filledCount / fields.length) * 100);
  }, [form]);

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

      let matchedSource = null;
      let profileData = null;

      for (const source of profileSources) {
        const { data, error: profileError } = await supabase
          .from(source.table)
          .select('*')
          .eq(source.key, user.id)
          .maybeSingle();

        if (profileError) {
          if (isMissingSchemaError(profileError) || isRlsError(profileError)) {
            continue;
          }
          setStatus({ type: 'error', text: profileError.message });
          break;
        }

        if (data) {
          matchedSource = source;
          profileData = data;
          break;
        }
      }

      if (matchedSource) {
        setProfileStore(matchedSource);
      }

      if (profileData) {
        setForm({
          full_name: profileData.full_name || profileData.name || mergedForm.full_name,
          phone: profileData.phone || profileData.phone_number || mergedForm.phone,
          bio: profileData.bio || profileData.description || profileData.about || mergedForm.bio,
          avatar_url:
            profileData.avatar_url || profileData.avatar || profileData.image_url || mergedForm.avatar_url,
        });
      } else {
        setForm(mergedForm);
      }

      setLoading(false);
    };

    loadProfile();
  }, [navigate, profileSources]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', text: 'Iltimos, rasm faylini tanlang.' });
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', text: "Rasm hajmi 2 MB dan kichik bo'lishi kerak." });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatar_url: String(reader.result || '') }));
      setStatus({ type: 'success', text: 'Yangi avatar tanlandi. Saqlashni unutmang.' });
    };

    reader.onerror = () => {
      setStatus({ type: 'error', text: "Rasmni o'qishda xatolik yuz berdi." });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatar_url: '' }));
    setStatus({ type: 'success', text: 'Avatar olib tashlandi. Saqlashni unutmang.' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    const sourcesToTry = profileStore
      ? [profileStore, ...profileSources.filter((source) => source !== profileStore)]
      : profileSources;

    let lastStoreError = null;
    let profileSaved = false;

    for (const source of sourcesToTry) {
      const row = {
        [source.key]: userId,
        full_name: payload.full_name,
        phone: payload.phone,
        bio: payload.bio,
        avatar_url: payload.avatar_url,
        updated_at: new Date().toISOString(),
      };

      const result = await adaptiveUpsert(supabase, source.table, source.key, row);
      if (result.ok) {
        setProfileStore(source);
        profileSaved = true;
        lastStoreError = null;
        break;
      }

      if (isMissingSchemaError(result.error) || isRlsError(result.error)) {
        continue;
      }

      lastStoreError = result.error;
      break;
    }

    if (lastStoreError) {
      setSaving(false);
      setStatus({ type: 'error', text: lastStoreError.message });
      return;
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
    setStatus({
      type: 'success',
      text: profileSaved
        ? "Ma'lumotlar muvaffaqiyatli saqlandi."
        : "Ma'lumotlar saqlandi. (Jadvalga yozish RLS sabab cheklangan bo'lishi mumkin.)",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <p className="loading">Profil yuklanmoqda...</p>;
  }

  const avatarPreview = form.avatar_url?.trim();
  const displayName = form.full_name?.trim() || 'Foydalanuvchi';

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <div className="profile-hero">
          <div className="profile-hero-copy">
            <span className="profile-badge">Shaxsiy Kabinet</span>
            <h1 className="profile-title">Profilingizni did bilan boshqaring</h1>
            <p className="profile-subtitle">
              Shaxsiy ma&apos;lumotlaringizni yangilang, avatar joylang va profilingizni yanada
              ishonchli ko&apos;rinishga keltiring.
            </p>
          </div>

          <div className="profile-progress-card">
            <span className="profile-progress-label">Tayyorlik darajasi</span>
            <strong>{profileCompletion}%</strong>
            <div className="profile-progress-bar">
              <span style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>
        </div>

        <div className="profile-top">
          <div className="profile-avatar-wrap">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile avatar" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                {displayName[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="profile-avatar-ring" />
          </div>

          <div className="profile-user-meta">
            <h2>{displayName}</h2>
            <p className="profile-email">{email}</p>
            <div className="profile-pills">
              <span className="profile-pill">Profil faol</span>
              <span className="profile-pill profile-pill-soft">Buyzen member</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-section">
            <div className="profile-section-head">
              <h3>Avatar</h3>
              <p>Avatar rasmini faqat qurilmangizdan tanlang.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={handleAvatarSelect}
            />

            <div className="profile-upload-row">
              <button type="button" className="profile-btn profile-btn-secondary" onClick={handleAvatarPick}>
                Qurilmadan tanlash
              </button>
              <button
                type="button"
                className="profile-btn profile-btn-ghost"
                onClick={handleRemoveAvatar}
                disabled={!avatarPreview}
              >
                Avatarni olib tashlash
              </button>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-head">
              <h3>Asosiy ma&apos;lumotlar</h3>
              <p>Bu ma&apos;lumotlar profilingizda ko&apos;rinadi.</p>
            </div>

            <div className="profile-grid">
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
            </div>

            <textarea
              name="bio"
              className="profile-textarea"
              placeholder="O'zingiz haqingizda qisqacha yozing"
              value={form.bio}
              onChange={handleChange}
            />
          </div>

          {status.text && (
            <p className={`profile-status ${status.type === 'error' ? 'error' : 'success'}`}>
              {status.text}
            </p>
          )}

          <div className="profile-actions">
            <button type="submit" className="profile-btn" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : "O'zgarishlarni saqlash"}
            </button>

            <Link to="/update-password" className="profile-link-btn">
              Parolni yangilash
            </Link>

            <button onClick={handleLogout} className="profile-btn profile-logout-btn" type="button">
              Chiqish
            </button>
          </div>
        </form>

        <Link to="/become-seller" className="profile-seller-link">
          sotuvchi profili
        </Link>
      </div>
    </div>
  );
}
