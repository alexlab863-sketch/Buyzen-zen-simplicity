import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import { useNavigate } from "react-router-dom";
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


export default function CardDetailModal() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const getProduct = async () => {
      try {
        const response = await fetch(`https://dummyjson.com/products/${id}`);
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.log("Xato ketdi:", err);
      }
    };
    getProduct();
  }, [id]);

  if (!product) return <div className="loading">Yuklanmoqda...</div>;

  return (
    <div className="product-detail-container">
    <div className="product-detail-visual">

      
      {/* Chegirma badgi (Yangi) */}
      {product.discountPercentage && (
        <div className="product-detail-discount-badge">
          -{Math.round(product.discountPercentage)}%
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
{/* QR KOD QISMI */}
<div className="product-detail-qr-section">
  <div className="qr-code-wrapper">
    {/* QR Kod */}
    <img 
      src={product.meta?.qrCode} 
      alt="QR Code" 
      className="qr-code-img"
    />
    
    {/* Barcode - Minimalistik raqamli ko'rinish */}
    {product.meta?.barcode && (
      <div className="product-barcode-wrapper">
        <span className="barcode-label">Barcode</span>
        <img  src={`https://barcode.tec-it.com/barcode.ashx?data=${product.meta.barcode}&code=Code128&translateback=true`}
         alt="" 
         className="barcode-img"/>
      </div>
    )}
  </div>
</div>
      
    </div>



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
        <span className="product-detail-availability">{product.availabilityStatus}</span>
      </div>

      <p className="product-detail-desc">{product.description}</p>

      
      <div className="product-detail-perks">
        <div className="perk-item">
          <i className="perk-icon">🚚</i>
          <span>{product.shippingInformation}</span>
        </div>
        <div className="perk-item">
          <i className="perk-icon">🛡️</i>
          <span>{product.warrantyInformation}</span>
        </div>
        <div className="perk-item">
          <i className="perk-icon">🔄</i>
          <span>{product.returnPolicy}</span>
        </div>
      </div>

      <div className="product-detail-meta">
        <div className="product-detail-meta-item"><b>Brend:</b> {product.brand || "Noma'lum"}</div>
        <div className="product-detail-meta-item"><b>Vazni:</b> {product.weight}g</div>
        <div className="product-detail-meta-item"><b>O'lchamlari:</b> {product.dimensions?.width}x{product.dimensions?.height} sm</div>
        <div className="product-detail-meta-item"><b>Zaxirada:</b> {product.stock} dona</div>
      </div>

      <button className="product-detail-buy-btn">Savatchaga qo'shish</button>
    </div>
  </div>
  );
}