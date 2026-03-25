import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { supabase } from "../../supabaseClient";

export default function CardDetailModal() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCart, setIsInCart] = useState(false); // --- YANGI STATE: Savatda bormi? ---
  const [cartLoading, setCartLoading] = useState(false); // Tugma uchun yuklanish
  const navigate = useNavigate();

  useEffect(() => {
    const getProductData = async () => {
      try {
        // 1. Mahsulot ma'lumotlarini DummyJSON'dan olish
        const response = await fetch(`https://dummyjson.com/products/${id}`);
        const data = await response.json();
        setProduct(data);

        // 2. --- YANGI: Savatda bor-yo'qligini tekshirish ---
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cartItem } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', id)
            .single(); // Bitta elementni qaytaradi

          if (cartItem) {
            setIsInCart(true); // Savatda bor bo'lsa, holatni true qilamiz
          }
        }
      } catch (err) {
        console.log("Xato ketdi:", err);
      } finally {
        setLoading(false);
      }
    };
    getProductData();
  }, [id]);

  // --- YANGI: Aqlli Toggle Funksiyasi (Qo'shish / O'chirish) ---
  const handleCartToggle = async (product) => {
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      alert("Avval tizimga kiring, bro! 🔥");
      return;
    }

    setCartLoading(true); // Tugmani bloklab turish

    if (isInCart) {
      // --- 1-holat: Savatda bor, o'chirish kerak ---
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);

      if (error) {
        console.error("O'chirishda xato:", error);
      } else {
        setIsInCart(false); // Local state'ni yangilash
        // console.log("Savatdan o'chirildi"); // UX uchun alert o'rniga console
      }
    } else {
      // --- 2-holat: Savatda yo'q, qo'shish kerak ---
      const { error } = await supabase
        .from('cart_items')
        .upsert({ 
          user_id: user.id, 
          product_id: product.id, 
          quantity: 1, 
          is_local: false 
        }, { onConflict: 'user_id, product_id' });
  
      if (error) {
        console.error("Qo'shishda xato:", error);
      } else {
        setIsInCart(true); // Local state'ni yangilash
        // console.log("Savatga qo'shildi"); // UX uchun alert o'rniga console
      }
    }

    setCartLoading(false); // Tugmani ochish
  }

  if (loading) {
    return (
      <div className="detail-loader-container">
        <div className="neon-spinner"></div>
        <p>YUKLANMOQDA...</p>
      </div>
    );
  }

  if (!product) return <div className="detail-error">Mahsulot topilmadi 😕</div>;

  return (
    <div className="product-detail-container">
      {/* Chap tomon: Vizual */}
      <div className="product-detail-visual">
        {/* --- YANGI: Chegirma nishoni (Styled) --- */}
        {product.discountPercentage && (
          <div className="product-detail-discount-badge">
            -{Math.round(product.discountPercentage)}% OFF
          </div>
        )}

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 3500 }}
          style={{
            "--swiper-navigation-color": "var(--accent-color)",
            "--swiper-pagination-color": "var(--accent-color)",
          }}
          className="product-detail-swiper" 
        >
          {product.images?.map((url, index) => (
            <SwiperSlide key={index} className="product-detail-slide">
              <img src={url} alt={product.title} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* O'ng tomon: Info */}
      <div className="product-detail-info">
        <div className="product-detail-top-meta">
          <span className="product-detail-category">{product.category}</span>
          <span className="product-detail-sku">SKU: {product.sku}</span>
        </div>

        <h1 className="product-detail-title">{product.title}</h1>
        
        <div className="product-detail-rating-row">
          <div className="product-detail-rating">⭐ {product.rating}</div>
          <span className="product-detail-reviews-count">({product.reviews?.length} sharhlar)</span>
        </div>

        <div className="product-detail-price-box">
          <div className="product-detail-main-price">
            <span className="product-detail-price">${product.price}</span>
            {product.discountPercentage && (
              <span className="product-detail-old-price">
                ${(product.price * (1 + product.discountPercentage / 100)).toFixed(2)}
              </span>
            )}
          </div>
          <span className={`availability ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.availabilityStatus}
          </span>
        </div>

        <p className="product-detail-desc">{product.description}</p>

        <div className="product-detail-perks">
          <div className="perk-item">
            <span className="perk-icon">🚚</span>
            <span>{product.shippingInformation}</span>
          </div>
          <div className="perk-item">
            <span className="perk-icon">🛡️</span>
            <span>{product.warrantyInformation}</span>
          </div>
          <div className="perk-item return-policy">
            <span className="perk-icon">🔄</span>
            <span>{product.returnPolicy}</span>
          </div>
        </div>

        <div className="product-detail-meta">
          <div className="product-detail-meta-item"><b>Brend:</b> {product.brand || "Noma'lum"}</div>
          <div className="product-detail-meta-item"><b>Zaxirada:</b> {product.stock} dona</div>
        </div>

        {/* --- YANGI: Aqlli Toggle Tugmasi (Class'lar dinamik) --- */}
        <button 
          className={`product-detail-buy-btn ${isInCart ? 'added-to-cart' : ''} ${cartLoading ? 'loading' : ''}`} 
          onClick={() => handleCartToggle(product)}
          disabled={cartLoading}
        >
          {cartLoading ? 'KUTING...' : (isInCart ? 'QO\'SHILDI (O\'CHIRISH)' : 'SAVATCHAGA QO\'SHISH')}
        </button>
      </div>
    </div>
  );
}