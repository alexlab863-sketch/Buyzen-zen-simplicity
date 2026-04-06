import { useState, useEffect, useMemo } from 'react';
import Card from './Card';
import ReactPaginate from 'react-paginate'; 
import { supabase } from '../../supabaseClient';

const Paginate = ReactPaginate.default ? ReactPaginate.default : ReactPaginate;

function Products({ showFilters = true }) { // Katta F bilan yozgan ma'qul
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Supabase xatolik:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map(p => p.category))].filter(Boolean);
    return ['Barchasi', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesCategory = selectedCategory === 'Barchasi' || p.category === selectedCategory;
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = (p.price || 0) >= priceRange.min && (p.price || 0) <= priceRange.max;
        return matchesCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'cheap') return a.price - b.price;
        if (sortBy === 'expensive') return b.price - a.price;
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;
  const currentItems = filteredProducts.slice(itemOffset, itemOffset + itemsPerPage);
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredProducts.length;
    setItemOffset(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div class="textWrapper" style={{margin: "auto"}}>
  <p class="text">Loading...</p>
  <div class="invertbox"></div>
</div>;

  return (
    // Agar showFilters false bo'lsa "no-sidebar" klassi qo'shiladi
    <div className={`products-layout ${!showFilters ? 'no-sidebar' : ''}`}>
      
      {showFilters && (
        <aside className="filter-sidebar">
          <div className="filter-group">
            <h4>Qidiruv</h4>
            <input 
              type="text" 
              placeholder="Nomini yozing..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <h4>Kategoriya</h4>
            <div className="category-list">
              {categories.map(cat => (
                <label key={cat} className="category-item">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={selectedCategory === cat}
                    onChange={() => {
                      setSelectedCategory(cat);
                      setItemOffset(0);
                    }}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h4>Narx oralig'i</h4>
            <div className="price-inputs">
              <input 
                type="number" 
                value={priceRange.min}
                onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
              />
              <input 
                type="number" 
                value={priceRange.max}
                onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="filter-group">
            <h4>Saralash</h4>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="newest">Yangi qo'shilganlar</option>
              <option value="cheap">Arzonroq</option>
              <option value="expensive">Qimmatroq</option>
            </select>
          </div>

          <button className="reset-filter" onClick={() => {
            setSelectedCategory('Barchasi');
            setSearchTerm('');
            setPriceRange({ min: 0, max: 10000000 });
            setSortBy('newest');
          }}>
            Filtrni tozalash
          </button>
        </aside>
      )}

      <main className="products-main">
        {filteredProducts.length === 0 ? (
          <div className="no-products">Hozircha mahsulot yo'q</div>
        ) : (
          <>
            {/* Card o'zining gridiga ega bo'lishi kerak */}
            <Card products={currentItems} />
            
            <div className="pagination-wrapper">
              <Paginate
                breakLabel="..."
                nextLabel=">"
                onPageChange={handlePageClick}
                pageRangeDisplayed={3}
                pageCount={pageCount}
                previousLabel="<"
                containerClassName="pagination"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Products;