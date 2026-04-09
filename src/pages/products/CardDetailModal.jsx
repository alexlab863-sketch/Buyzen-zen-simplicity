import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { supabase } from "../../supabaseClient";
import "./Style/ProductStyle.css";

export default function CardDetailModal() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCart, setIsInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [commentText, setCommentText] = useState("Yaxshi tomoni: \n\nYomon tarafi: ");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        setProduct(data);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cartItem } = await supabase.from('cart_items').select('*').eq('user_id', user.id).eq('product_id', id).single();
          if (cartItem) setIsInCart(true);
        }
        await fetchComments();
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAllData();
  }, [id]);

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('product_id', id).order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Iltimos, yulduzcha qo'ying!");
    
    // Matnni tekshirish (ikkala qism ham to'ldirilgan bo'lishi kerak)
    const hasPros = commentText.includes("Yaxshi tomoni:") && commentText.split("Yaxshi tomoni:")[1].split("Yomon tarafi:")[0].trim().length > 3;
    const hasCons = commentText.includes("Yomon tarafi:") && commentText.split("Yomon tarafi:")[1].trim().length > 3;

    if (!hasPros || !hasCons) return alert("Iltimos, mahsulotning ham yaxshi, ham yomon tomonlarini to'liq yozing!");

    setCommentSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Avval tizimga kiring!");

      const { error } = await supabase.from('comments').insert([{
        product_id: id,
        user_id: user.id,
        user_name: user.user_metadata.full_name || "Mijoz",
        content: commentText,
        rating: rating
      }]);

      if (error) throw error;
      setCommentText("Yaxshi tomoni: \n\nYomon tarafi: ");
      setRating(0);
      await fetchComments();
    } catch (err) {
      alert(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) return <div className="textWrapper" style={{margin: "auto"}}><p className="text">Loading...</p><div className="invertbox"></div></div>;
  if (!product) return null;

  const images = product.content?.gallery || [product.image_url];

  return (
    <div className="product-detail-overlay">
      <div className="product-detail-modal full-page-detail">
        <button className="close-modal-btn" onClick={() => navigate(-1)}>✕</button>
        
        <div className="product-detail-grid">
          <div className="gallery-side">
            <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} className="detail-swiper">
              {images.map((img, i) => (
                <SwiperSlide key={i}><img src={img} alt={product.name} /></SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="info-side">
            <h1>{product.name}</h1>
            <p className="price">{product.price?.toLocaleString()} so'm</p>
            <p className="description">{product.description}</p>
            <div className="meta">
              <p><b>Brend:</b> <span>{product.brand || "Noma'lum"}</span></p>
              <p><b>Kategoriya:</b> <span>{product.category}</span></p>
              <p><b>Holat:</b> <span>{product.stock_count > 0 ? "Sotuvda mavjud" : "Tugagan"}</span></p>
            </div>
            <button className={`detail-action-btn ${isInCart ? 'added' : ''}`} onClick={async () => {
                setCartLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return alert("Tizimga kiring!");
                if (isInCart) {
                    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', id);
                    setIsInCart(false);
                } else {
                    await supabase.from('cart_items').insert([{ user_id: user.id, product_id: id, quantity: 1 }]);
                    setIsInCart(true);
                }
                setCartLoading(false);
            }}>
              {cartLoading ? "..." : (isInCart ? "🛒 Savatda mavjud" : "🛒 Savatga qo'shish")}
            </button>
          </div>
        </div>

        <div className="comments-section">
          <h3>Mijozlar fikri ({comments.length})</h3>
          <form onSubmit={handleSendComment} className="comment-form">
            <div className="star-rating-wrapper">
              <span>Baholang:</span>
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`star-icon ${i + 1 <= (hover || rating) ? "active" : ""}`}
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHover(i + 1)}
                    onMouseLeave={() => setHover(0)}
                  >&#9733;</span>
                ))}
              </div>
            </div>
            <textarea 
              className="feedback-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="6"
            />
            <button type="submit" className="comment-submit-btn" disabled={commentSubmitting}>
              {commentSubmitting ? "Yuborilmoqda..." : "Sharhni yuborish"}
            </button>
          </form>

          <div className="comments-list">
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <strong>{c.user_name}</strong>
                  <div className="comment-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < c.rating ? "star-filled" : "star-empty"}>&#9733;</span>
                    ))}
                  </div>
                  <span className="comment-date">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}