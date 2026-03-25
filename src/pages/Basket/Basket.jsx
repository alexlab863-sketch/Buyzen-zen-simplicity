import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import "./Style/Basket.css";

const Basket = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const basketRef = useRef([]); 

  useEffect(() => {
    const fetchCart = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: sbItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (sbItems && sbItems.length > 0) {
        const productPromises = sbItems.map(item => 
          fetch(`https://dummyjson.com/products/${item.product_id}`).then(res => res.json())
        );
        const products = await Promise.all(productPromises);
        
        const mergedData = products.map((p, index) => {
          const sbItem = sbItems.find(si => si.product_id === p.id);
          return {
            ...p,
            quantity: sbItem ? sbItem.quantity : 1,
            is_local: sbItem ? sbItem.is_local : false
          };
        });

        setCartItems(mergedData);
        basketRef.current = mergedData; 
      }
      setLoading(false);
    };

    fetchCart();

    // Sahifadan chiqayotganda avtomatik saqlash
    return () => {
      if (basketRef.current.length > 0) {
        syncWithSupabase(basketRef.current);
      }
    };
  }, []);

  const syncWithSupabase = async (currentItems) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || currentItems.length === 0) return;

    const updates = currentItems.map(item => ({
      user_id: user.id,
      product_id: item.id,
      quantity: item.quantity,
      is_local: item.is_local
    }));

    await supabase.from('cart_items').upsert(updates, { onConflict: 'user_id, product_id' });
  };

  const updateQty = (id, delta) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    basketRef.current = updated;
  };

  const removeItem = async (productId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    const updated = cartItems.filter(item => item.id !== productId);
    setCartItems(updated);
    basketRef.current = updated;
  };

  const orderItem = async (item) => {
    const confirmOrder = window.confirm(`"${item.title}" uchun buyurtma berishni tasdiqlaysizmi?`);
    if (confirmOrder) {
      await removeItem(item.id);
      alert("Buyurtma qabul qilindi!");
    }
  };

  if (loading) return <div className="loader">YUKLANMOQDA...</div>;

  return (
    <div className="basket-container">
      <h2 className="basket-title">Sening Savatchang</h2>
      
      {cartItems.length > 0 ? (
        <div className="basket-grid">
          {cartItems.map(item => (
            <div key={item.id} className="basket-card">
              <div className="card-image">
                <img src={item.thumbnail} alt={item.title} />
              </div>
              
              <div className="card-info">
                <h4>{item.title}</h4>
                <p className="price">${item.price}</p>
              </div>

              <div className="card-controls">
                <div className="control-row">
                  <div className="counter">
                    <button onClick={() => updateQty(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>
                    &times;
                  </button>
                </div>
                
                <p className="item-total">Jami: <span>${(item.price * item.quantity).toFixed(2)}</span></p>
                
                <button className="card-order-btn" onClick={() => orderItem(item)}>
                  BUYURTMA BERISH
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-cart">
          <p className="empty-msg">Savatchangiz hozircha bo'sh.</p>
        </div>
      )}
    </div>
  );
};

export default Basket;