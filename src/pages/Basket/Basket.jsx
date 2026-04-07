import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import "./Style/Basket.css";

const Basket = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
          products (id, name, price, image_url, stock_count)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedData = data.map(item => ({
        cart_id: item.id,
        id: item.product_id,
        name: item.products?.name || "Noma'lum mahsulot",
        price: item.products?.price || 0,
        image_url: item.products?.image_url || "",
        stock_count: item.products?.stock_count || 0,
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
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > (item.stock_count || 0)) {
      alert(`Omborda faqat ${item.stock_count || 0} ta "${item.name}" mavjud.`);
      return;
    }

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

  const fetchLatestStock = async (productId) => {
    const { data, error } = await supabase
      .from('products')
      .select('id, stock_count')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data?.stock_count || 0;
  };

  const handleSingleCheckout = async (item) => {
    if (checkoutLoading) return;

    try {
      setCheckoutLoading(true);
      const latestStock = await fetchLatestStock(item.id);

      if (item.quantity > latestStock) {
        alert(`"${item.name}" bo'yicha so'ralgan miqdor ombordagidan ko'p. Hozir mavjud: ${latestStock} ta.`);
        setCartItems((prev) => prev.map((cartItem) => (
          cartItem.cart_id === item.cart_id ? { ...cartItem, stock_count: latestStock } : cartItem
        )));
        return;
      }

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_count: latestStock - item.quantity })
        .eq('id', item.id);

      if (stockError) throw stockError;

      const { error: removeError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', item.cart_id);

      if (removeError) throw removeError;

      setCartItems((prev) => prev.filter((cartItem) => cartItem.cart_id !== item.cart_id));
      alert(`${item.name} muvaffaqiyatli sotib olindi.`);
    } catch (error) {
      alert(`Xatolik: ${error.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleAllCheckout = async () => {
    if (checkoutLoading || cartItems.length === 0) return;

    try {
      setCheckoutLoading(true);

      const stockChecks = await Promise.all(
        cartItems.map(async (item) => ({
          item,
          latestStock: await fetchLatestStock(item.id),
        }))
      );

      const invalidItems = stockChecks.filter(({ item, latestStock }) => item.quantity > latestStock);

      if (invalidItems.length > 0) {
        const message = invalidItems
          .map(({ item, latestStock }) => `${item.name}: savatda ${item.quantity} ta, omborda ${latestStock} ta`)
          .join('\n');

        setCartItems((prev) => prev.map((cartItem) => {
          const matched = stockChecks.find(({ item }) => item.cart_id === cartItem.cart_id);
          return matched ? { ...cartItem, stock_count: matched.latestStock } : cartItem;
        }));

        alert(`Quyidagi mahsulotlarda yetarli zaxira yo'q:\n${message}`);
        return;
      }

      for (const { item, latestStock } of stockChecks) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_count: latestStock - item.quantity })
          .eq('id', item.id);

        if (stockError) throw stockError;

        const { error: removeError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', item.cart_id);

        if (removeError) throw removeError;
      }

      setCartItems([]);
      alert("Barcha mahsulotlar muvaffaqiyatli sotib olindi.");
    } catch (error) {
      alert(`Xatolik: ${error.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Umumiy hisobni chiqarish
  const totalSum = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (loading) return <div className="textWrapper" style={{margin: "auto"}}>
  <p className="text">Loading...</p>
  <div className="invertbox"></div>
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
                  <p className="basket-stock">Omborda: {item.stock_count || 0} ta</p>
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
                  <button className="card-order-btn" disabled={checkoutLoading} onClick={() => handleSingleCheckout(item)}>
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
                <button className="main-checkout-btn" disabled={checkoutLoading} onClick={handleAllCheckout}>
                   {checkoutLoading ? "Tekshirilmoqda..." : "HAMMASINI SOTIB OLISH"}
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
