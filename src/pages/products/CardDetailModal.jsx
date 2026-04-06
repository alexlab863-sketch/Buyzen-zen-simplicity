import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { supabase } from "../../supabaseClient";
import "./Style/ProductStyle.css"; // Modal uchun alohida CSS fayli (tavsiya etiladi)

export default function CardDetailModal() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCart, setIsInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  
  // Kommentariya uchun state-lar
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  
  const navigate = useNavigate();

  // 1. Mahsulot, Savat va Kommentariyalarni yuklash
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // a. Mahsulot ma'lumotlarini olish
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);

        // b. Savatda bor-yo'qligini tekshirish
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cartItem } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', id)
            .single();
          
          if (cartItem) setIsInCart(true);
        }

        // c. Kommentariyalarni yuklash
        await fetchComments();

      } catch (err) {
        console.error("Xatolik:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAllData();
  }, [id]);

  // 2. Kommentariyalarni yuklash funksiyasi (insert-dan keyin chaqirish uchun alohida)
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    if (!error) setComments(data);
  };

  // 3. Savatga qo'shish/o'chirish mantiqi (Detail Page-da toggle bo'lgani ma'qul)
  const handleCartToggle = async () => {
    setCartLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Savatdan foydalanish uchun tizimga kiring!");
        return;
      }

      if (isInCart) {
        // Savatdan o'chirish
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        setIsInCart(false);
      } else {
        // Savatga qo'shish
        await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: id, quantity: 1 }]);
        setIsInCart(true);
      }
    } catch (error) {
      console.error("Cart error:", error.message);
    } finally {
      setCartLoading(false);
    }
  };

  // 4. Kommentariya yuborish funksiyasi
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Izoh qoldirish uchun tizimga kiring!");
        return;
      }

      const { error } = await supabase
        .from('comments')
        .insert([{
          product_id: id,
          user_id: user.id,
          user_name: user.user_metadata.full_name || "Mijoz",
          content: newComment.trim()
        }]);

      if (error) throw error;
      
      setNewComment("");
      await fetchComments(); // Ro'yxatni yangilash
    } catch (err) {
      alert("Izoh yuborishda xatolik: " + err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) return (
    <div className="textWrapper" style={{margin: "auto"}}>
      <p className="text">Loading...</p>
      <div className="invertbox"></div>
    </div>
  );

  if (!product) return <div className="error">Mahsulot topilmadi!</div>;

  // Rasmlar galereyasini tayyorlash (agar gallery yo'q bo'lsa, asosiy rasm ishlatiladi)
  const images = product.content?.gallery || [product.image_url];

  return (
    <div className="product-detail-overlay">
      <div className="product-detail-modal">
        <button className="close-modal-btn" onClick={() => navigate(-1)}>✕</button>
        
        <div className="product-detail-grid">
          {/* Swiper Karuseli ishlatilgan joy */}
          <div className="gallery-side">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={true}
              pagination={{ clickable: true }}
              className="detail-swiper"
            >
              {images.map((img, index) => (
                <SwiperSlide key={index}>
                  <img src={img} alt={`${product.name} ${index + 1}`} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="info-side">
            <h1>{product.name}</h1>
            <p className="price">{product.price?.toLocaleString()} so'm</p>
            <p className="description">{product.description}</p>
            
            <div className="meta">
              <p><b>Brend:</b> {product.brand || "Mavjud emas"}</p>
              <p><b>Kategoriya:</b> {product.category || "Umumiy"}</p>
              <p><b>Holat:</b> {product.stock_count > 0 ? "Sotuvda bor" : "Tugagan"}</p>
            </div>

            <button 
              className={`detail-action-btn ${isInCart ? 'added' : ''}`}
              onClick={handleCartToggle}
              disabled={cartLoading}
            >
              {cartLoading ? "..." : (isInCart ? "🛒 Savatdan o'chirish" : "🛒 Savatga qo'shish")}
            </button>
          </div>
        </div>

        {/* --- Kommentariyalar bo'limi --- */}
        <div className="comments-section">
          <hr />
          <h3>Mijozlar fikri ({comments.length})</h3>

          <form onSubmit={handleSendComment} className="comment-form">
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Fikringizni yozib qoldiring..."
              required
            />
            <button type="submit" disabled={commentSubmitting}>
              {commentSubmitting ? "..." : "Yuborish"}
            </button>
          </form>

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <strong>{c.user_name}</strong>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p>{c.content}</p>
                </div>
              ))
            ) : (
              <p className="no-comments">Hozircha izohlar yo'q. Birinchi bo'lib fikr bildiring!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}