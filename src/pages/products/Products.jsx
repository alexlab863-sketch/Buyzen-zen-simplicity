import { useState, useEffect } from 'react';
import Card from './Card';
import ReactPaginate from 'react-paginate'; 
import { supabase } from '../../supabaseClient';
import { isMissingSchemaError, isRlsError } from '../../utils/supabaseAdaptive';


const Paginate = ReactPaginate.default ? ReactPaginate.default : ReactPaginate;

function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productSources = ['products', 'seller_products', 'shop_products'];
        let supabaseProducts = null;

        for (const table of productSources) {
          const { data, error } = await supabase.from(table).select('*').limit(1000);

          if (error) {
            if (isMissingSchemaError(error) || isRlsError(error)) {
              continue;
            }
            console.error('Supabase xatolik:', error.message);
            continue;
          }

          if (data?.length) {
            supabaseProducts = data.map((item, index) => ({
              id: item.id ?? item.product_id ?? `${table}-${index}`,
              title: item.title ?? item.name ?? 'Nomsiz mahsulot',
              brand: item.brand ?? item.store_name ?? item.seller_name ?? '',
              price: item.price ?? 0,
              thumbnail:
                item.thumbnail ||
                item.image_url ||
                item.image ||
                'https://dummyimage.com/400x300/1f2937/ffffff&text=Product',
            }));
            break;
          }
        }

        if (supabaseProducts && supabaseProducts.length) {
          setProducts(supabaseProducts);
          return;
        }

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
       {}
     
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
