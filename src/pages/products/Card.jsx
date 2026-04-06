import "./Style/ProductStyle.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function Card({ products }) {
    const navigate = useNavigate();
    const [cartIds, setCartIds] = useState([]); // Savatdagi mahsulot ID-lari ro'yxati
    const [loadingId, setLoadingId] = useState(null); // Qaysi tugma yuklanayotgani

    // 1. Savatdagi mahsulotlarni tekshirish
    useEffect(() => {
        const checkCart = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('cart_items')
                    .select('product_id')
                    .eq('user_id', user.id);
                
                if (data) setCartIds(data.map(item => item.product_id));
            }
        };
        checkCart();
    }, []);

    // 2. Savatga qo'shish yoki o'chirish funksiyasi
    const toggleCart = async (e, productId) => {
        e.stopPropagation(); // Kartochka bosilib ketishini oldini oladi
        setLoadingId(productId);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Savatdan foydalanish uchun tizimga kiring!");
                return;
            }

            if (cartIds.includes(productId)) {
                // Savatdan o'chirish
                await supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);
                setCartIds(prev => prev.filter(id => id !== productId));
            } else {
                // Savatga qo'shish
                await supabase
                    .from('cart_items')
                    .insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);
                setCartIds(prev => [...prev, productId]);
            }
        } catch (error) {
            console.error("Cart error:", error.message);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="card-container"> 
            {products && products.map(product => {
                const isAdded = cartIds.includes(product.id);
                
                return (
                    <div key={product.id} className="card-item"> 
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="card-image" 
                          onClick={() => navigate(`/product/${product.id}`)}
                        />
                        <div className="card-content"> 
                            <h3 className="card-title">{product.name}</h3> 
                            <p className="card-price">{product.price?.toLocaleString()} so'm</p> 
                        </div>
                        
                        <div className="card-actions">
                            <button 
                                className="card-btn detail-btn" 
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                Batafsil
                            </button>
                            
                            <button 
                                className={`card-btn basket-btn ${isAdded ? 'added' : ''}`}
                                onClick={(e) => toggleCart(e, product.id)}
                                disabled={loadingId === product.id}
                            >
                                {loadingId === product.id ? "..." : (isAdded ? "🛒 Savatda" : "🛒 +")}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}