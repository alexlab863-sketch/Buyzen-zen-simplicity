import { useState, useEffect } from 'react';
import Card from './Card';
import ReactPaginate from 'react-paginate'; 

const Paginate = ReactPaginate.default ? ReactPaginate.default : ReactPaginate;

function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://dummyjson.com/products?limit=1000'); 
        const data = await response.json(); 
        
     
        setProducts(data.products); 
      } catch (error) {
        console.error('Xatolik:', error);
      }
    };
    fetchProducts();
  }, []);


  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 10;
  
  const endOffset = itemOffset + itemsPerPage;

  const currentItems = products.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(products.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % products.length;
    setItemOffset(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="products-container">
      {products.length === 0 ? (
        <div className="loading">Mahsulotlar yuklanmoqda...</div>
      ) : (
        <>
       
          <Card products={currentItems} />

    
          <Paginate
            breakLabel="..."
            nextLabel="keyingi >"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            pageCount={pageCount}
            previousLabel="< oldingi"
            renderOnZeroPageCount={null}
            
            containerClassName="pagination"
            pageClassName="page-item"
            pageLinkClassName="page-link"
            previousClassName="page-item"
            previousLinkClassName="page-link"
            nextClassName="page-item"
            nextLinkClassName="page-link"
            activeClassName="active"
          />
        </>
      )}
    </div>
  );
}

export default Products;