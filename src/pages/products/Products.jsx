import { useState, useEffect } from 'react';
import Card from './Card';
 

function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://fakestoreapi.com/products');
      const data = await response.json(); 
      setProducts(data); 
    } catch (error) {
      console.error('Mahsulotlarni olishda xatolik:', error);
    }
  };
  
    fetchProducts();
  }, []);


 


  return (
    <div>
     {products.length === 0 ? `Mahsulotlar yuklanmoqda...` :null}
      <Card products={products}  />
    </div>
  );
}

export default Products;    