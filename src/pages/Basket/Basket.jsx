import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import "./Style/Basket.css";

const Basket = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_id,
          products (id, name, price, image_url)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedData = data.map(item => ({
        cart_id: item.id,
        id: item.product_id,
        name: item.products?.name || "Noma'lum mahsulot",
        price: item.products?.price || 0,
        image_url: item.products?.image_url || "",
        quantity: item.quantity
      }));

      setCartItems(formattedData);
    } catch (error) {
      console.error("Basket fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (cartId, delta) => {
    const item = cartItems.find(i => i.cart_id === cartId);
    const newQty = item.quantity + delta;
    if (newQty < 1) return;

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', cartId);

    if (!error) {
      setCartItems(prev => prev.map(i => i.cart_id === cartId ? { ...i, quantity: newQty } : i));
    }
  };

  const removeItem = async (cartId) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartId);
    if (!error) {
      setCartItems(prev => prev.filter(i => i.cart_id !== cartId));
    }
  };

  // Umumiy hisobni chiqarish
  const totalSum = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) return <div class="textWrapper" style={{margin: "auto"}}>
  <p class="text">Loading...</p>
  <div class="invertbox"></div>
</div>;

  return (
    <div className="basket-container">
      <h2 className="basket-title">Savatchangiz</h2>
      
      {cartItems.length > 0 ? (
        <>
          <div className="basket-grid">
            {cartItems.map(item => (
              <div key={item.cart_id} className="basket-card">
                <div className="card-image">
                  <img src={item.image_url} alt={item.name} />
                </div>
                
                <div className="card-info">
                  <h4>{item.name}</h4>
                  <p className="price">{item.price?.toLocaleString()} so'm</p>
                </div>

                <div className="card-controls">
                  <div className="control-row">
                    <div className="counter">
                      <button onClick={() => updateQty(item.cart_id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQty(item.cart_id, 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeItem(item.cart_id)}>&times;</button>
                  </div>
                  
                  <p className="item-total">Jami: <span>{(item.price * item.quantity).toLocaleString()} so'm</span></p>
                  
                  {/* ALOHIDA BUYURTMA BERISH TUGMASI (KARD ICHIDA) */}
                  <button className="card-order-btn" onClick={() => alert(`${item.name} uchun buyurtma qabul qilindi!`)}>
                    FAQAT SHUNI SOTIB OLISH
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* UMUMIY BUYURTMA BERISH QISMI (PASTDA) */}
          <div className="basket-summary-fixed">
             <div className="summary-content">
                <div className="total-info">
                   <span>Umumiy mahsulotlar: {cartItems.length} ta</span>
                   <h3>Jami: {totalSum.toLocaleString()} so'm</h3>
                </div>
                <button className="main-checkout-btn" onClick={() => alert("Barcha mahsulotlar uchun buyurtma berildi!")}>
                   HAMMASINI SOTIB OLISH
                </button>
             </div>
          </div>
        </>
      ) : (
        <div className="empty-cart">
          <p className="empty-msg">Savatchangiz bo'sh.</p>
        </div>
      )}
    </div>
  );
};

export default Basket;