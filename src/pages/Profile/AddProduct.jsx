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
};

const CATEGORY_OPTIONS = [
  'Elektronika', 'Telefonlar', 'Noutbuklar', 'Aksessuarlar', 'Maishiy texnika',
  'Erkaklar kiyimi', 'Ayollar kiyimi', 'Bolalar kiyimi', 'Oyoq kiyim',
  'Gozallik mahsulotlari', 'Salomatlik', 'Oziq-ovqat', 'Ichimliklar',
  'Kitoblar', 'Sport jihozlari', 'Avto mahsulotlar', 'Uy jihozlari',
  'Mebel', 'Oyinqchoqlar', 'Zargarlik buyumlari',
];

export default function AddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [form, setForm] = useState(INITIAL_FORM);
  
  // Preview uchun Base64, yuklash uchun haqiqiy File obyektlari
  const [galleryImages, setGalleryImages] = useState([]); 
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        navigate('/login');
        return;
      }

      const user = session.user;
      setUserId(user.id);

      // Seller ekanligini bazadan tekshirish
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setIsSeller(!!sellerData);
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
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setStatus({ type: 'error', text: 'Faqat rasm fayllarini tanlang.' });
      return;
    }

    setImageFiles(files); // Storage uchun fayllarni saqlash

    // Preview (ekranda ko'rsatish) uchun
    Promise.all(
      files.map((file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.readAsDataURL(file);
        })
      )
    ).then((previews) => {
      setGalleryImages(previews);
      setStatus({ type: 'success', text: '3 ta rasm yuklashga tayyor.' });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !isSeller || submitting) return;

    const { name, description, category, price, stock_count } = form;

    if (!name || !description || !category || imageFiles.length !== 3) {
      setStatus({ type: 'error', text: "Barcha maydonlarni to'ldiring va 3 ta rasm yuklang." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', text: 'Yuklanmoqda...' });

    try {
      // 1. Rasmlarni Storage-ga yuklash
      const uploadedUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          return data.publicUrl;
        })
      );

      // 2. Bazaga (Products) ma'lumotlarni yozish
      const { error: insertError } = await supabase.from('products').insert([{
        seller_id: userId,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock_count: Number(stock_count),
        category: category,
        image_url: uploadedUrls[0], // Asosiy rasm
        content: {
          gallery: uploadedUrls,
          created_at: new Date().toISOString()
        }
      }]);

      if (insertError) throw insertError;

      setStatus({ type: 'success', text: "Mahsulot muvaffaqiyatli qo'shildi!" });
      setForm(INITIAL_FORM);
      setGalleryImages([]);
      setImageFiles([]);

    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div class="textWrapper" style={{margin: "auto"}}>
  <p class="text">Loading...</p>
  <div class="invertbox"></div>
</div>;

  return (
    <div className="profile-wrapper seller-page-wrapper">
      <section className="seller-layout">
        <article className="seller-hero-card">
          <span className="seller-chip">Seller Product</span>
          <h1 className="seller-title">Yangi mahsulot qo&apos;shish</h1>
          <p className="seller-subtitle">
            Mahsulot ma&apos;lumotlarini kiriting. Rasmlar bulutli xotiraga saqlanadi.
          </p>
        </article>

        <article className="seller-form-card">
          {!isSeller && (
            <p className="profile-status error">
              Siz hozircha seller emassiz.
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
              name="price"
              className="profile-input"
              placeholder="Narx (so'm)"
              value={form.price}
              onChange={handleChange}
              required
            />

            <input
              type="number"
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
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="profile-file-input"
              onChange={handleImageSelect}
              hidden
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
                      alt={`Preview ${index + 1}`}
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

          <Link to="/profile" className="seller-back-link">Profilga qaytish</Link>
        </article>
      </section>
    </div>
  );
}