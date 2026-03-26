import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { isMissingSchemaError, isRlsError } from '../../utils/supabaseAdaptive';
import './Profile.css';

const INITIAL_FORM = {
  name: '',
  description: '',
  price: '',
  stock_count: '',
  category: '',
  image_url: '',
};

const CATEGORY_OPTIONS = [
  'Elektronika',
  'Telefonlar',
  'Noutbuklar',
  'Aksessuarlar',
  'Maishiy texnika',
  'Erkaklar kiyimi',
  'Ayollar kiyimi',
  'Bolalar kiyimi',
  'Oyoq kiyim',
  'Gozallik mahsulotlari',
  'Salomatlik',
  'Oziq-ovqat',
  'Ichimliklar',
  'Kitoblar',
  'Sport jihozlari',
  'Avto mahsulotlar',
  'Uy jihozlari',
  'Mebel',
  'Oyinqchoqlar',
  'Zargarlik buyumlari',
];

const PRODUCT_GALLERY_STORAGE_KEY = 'buyzen_product_galleries';

export default function AddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userId, setUserId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [form, setForm] = useState(INITIAL_FORM);
  const [galleryImages, setGalleryImages] = useState([]);

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

      setUserId(user.id);
      const metadata = user.user_metadata || {};
      let sellerFlag = Boolean(metadata.is_seller || metadata.role === 'seller');
      let resolvedSellerId = user.id;

      if (!sellerFlag) {
        const sellerSources = [
          { table: 'sellers', key: 'user_id' },
          { table: 'sellers', key: 'id' },
        ];

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
            break;
          }

          if (data) {
            sellerFlag = true;
            resolvedSellerId = data.id || user.id;
            break;
          }
        }
      }

      setIsSeller(sellerFlag);
      setSellerId(resolvedSellerId);
      setLoading(false);
    };

    loadUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length !== 3) {
      setStatus({ type: 'error', text: 'Iltimos, aynan 3 ta rasm tanlang.' });
      e.target.value = '';
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setStatus({ type: 'error', text: 'Tanlangan fayllarning barchasi rasm bo‘lishi kerak.' });
      e.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > 2 * 1024 * 1024);
    if (oversizedFile) {
      setStatus({ type: 'error', text: "Har bir rasm 2 MB dan kichik bo'lishi kerak." });
      e.target.value = '';
      return;
    }

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    )
      .then((images) => {
        setGalleryImages(images);
        setForm((prev) => ({ ...prev, image_url: images[0] || '' }));
        setStatus({ type: 'success', text: '3 ta mahsulot rasmi tanlandi.' });
      })
      .catch(() => {
        setStatus({ type: 'error', text: "Rasmlarni o'qishda xatolik yuz berdi." });
      })
      .finally(() => {
        e.target.value = '';
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (!isSeller) {
      setStatus({ type: 'error', text: "Faqat seller foydalanuvchi mahsulot qo'sha oladi." });
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const imageUrl = form.image_url.trim();
    const price = Number(form.price);
    const stockCount = Number(form.stock_count || 0);

    if (!name || !description || !category || !imageUrl || Number.isNaN(price) || Number.isNaN(stockCount)) {
      setStatus({
        type: 'error',
        text: "Iltimos, nom, tavsif, kategoriya, narx, soni va rasm maydonlarini to'ldiring.",
      });
      return;
    }

    if (galleryImages.length !== 3) {
      setStatus({ type: 'error', text: 'Mahsulot uchun aynan 3 ta rasm tanlanishi kerak.' });
      return;
    }

    if (price <= 0 || stockCount <= 0) {
      setStatus({ type: 'error', text: "Narx va mahsulot soni 0 dan katta bo'lishi kerak." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', text: '' });

    const productId = crypto.randomUUID();
    const row = {
      id: productId,
      seller_id: userId,
      name,
      description,
      price,
      image_url: imageUrl,
      stock_count: stockCount,
      category,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('products').insert(row);

    if (error) {
      setSubmitting(false);
      setStatus({
        type: 'error',
        text: isRlsError(error)
          ? "Products jadvaliga yozishga ruxsat yo'q. Supabase RLS policy ni tekshiring."
          : error.message,
      });
      return;
    }

    const storedGalleries = JSON.parse(localStorage.getItem(PRODUCT_GALLERY_STORAGE_KEY) || '{}');
    storedGalleries[productId] = galleryImages;
    localStorage.setItem(PRODUCT_GALLERY_STORAGE_KEY, JSON.stringify(storedGalleries));

    setSubmitting(false);
    setForm(INITIAL_FORM);
    setGalleryImages([]);
    setStatus({ type: 'success', text: "Mahsulot muvaffaqiyatli qo'shildi." });
  };

  if (loading) {
    return <p className="loading">Sahifa yuklanmoqda...</p>;
  }

  return (
    <div className="profile-wrapper seller-page-wrapper">
      <section className="seller-layout">
        <article className="seller-hero-card">
          <span className="seller-chip">Seller Product</span>
          <h1 className="seller-title">Yangi mahsulot qo&apos;shish</h1>
          <p className="seller-subtitle">
            Mahsulot ma&apos;lumotlarini kiriting. Narx so&apos;mda saqlanadi va product alohida
            `uuid` identifikator bilan yoziladi.
          </p>
        </article>

        <article className="seller-form-card">
          {!isSeller && (
            <p className="profile-status error">
              Siz hozircha seller emassiz. Mahsulot qo&apos;shish uchun avval seller bo&apos;ling.
            </p>
          )}

          <form className="seller-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              className="profile-input"
              placeholder="Mahsulot nomi"
              value={form.name}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              className="profile-textarea"
              placeholder="Mahsulot tavsifi"
              value={form.description}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              min="1"
              step="0.01"
              name="price"
              className="profile-input"
              placeholder="Narx (so'm)"
              value={form.price}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              min="1"
              name="stock_count"
              className="profile-input"
              placeholder="Soni (stock)"
              value={form.stock_count}
              onChange={handleChange}
              required
            />

            <select
              name="category"
              className="profile-input"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Kategoriyani tanlang</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="profile-file-input"
              onChange={handleImageSelect}
            />

            <button
              type="button"
              className="profile-btn profile-btn-secondary"
              onClick={handleImagePick}
            >
              Qurilmadan 3 ta rasm tanlash
            </button>

            {galleryImages.length > 0 && (
              <div className="profile-product-preview-grid">
                {galleryImages.map((image, index) => (
                  <div key={index} className="profile-product-preview">
                    <img
                      src={image}
                      alt={`Mahsulot preview ${index + 1}`}
                      className="profile-product-preview-image"
                    />
                  </div>
                ))}
              </div>
            )}

            {status.text && (
              <p className={`profile-status ${status.type === 'error' ? 'error' : 'success'}`}>{status.text}</p>
            )}

            <button type="submit" className="profile-btn" disabled={!isSeller || submitting}>
              {submitting ? "Qo'shilmoqda..." : "Mahsulot qo'shish"}
            </button>
          </form>

          <Link to="/profile" className="seller-back-link">
            Profilga qaytish
          </Link>
        </article>
      </section>
    </div>
  );
}
