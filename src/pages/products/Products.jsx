import { useState, useEffect, useMemo } from 'react';
import Card from './Card';
import ReactPaginate from 'react-paginate'; 
import { supabase } from '../../supabaseClient';

const Paginate = ReactPaginate.default ? ReactPaginate.default : ReactPaginate;

function Products({ showFilters = true }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtrlar uchun state-lar
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [selectedBrand, setSelectedBrand] = useState('Barchasi'); // Brend uchun yangi state
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [sortBy, setSortBy] = useState('newest');
  const [catSearch, setCatSearch] = useState(''); 

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

  // Kategoriyalarni yig'ish
  const categories = useMemo(() => {
    const unique = [...new Set(products.map(p => p.category))].filter(Boolean);
    return ['Barchasi', ...unique];
  }, [products]);

  // Brendlarni yig'ish
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand))].filter(Boolean);
    return ['Barchasi', ...uniqueBrands];
  }, [products]);

  // Kategoriya qidiruvi
  const displayedCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.toLowerCase().includes(catSearch.toLowerCase())
    );
  }, [categories, catSearch]);

  // Filtrlash mantiqi
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesCategory = selectedCategory === 'Barchasi' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'Barchasi' || p.brand === selectedBrand;
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = (p.price || 0) >= priceRange.min && (p.price || 0) <= priceRange.max;
        return matchesCategory && matchesBrand && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'cheap') return a.price - b.price;
        if (sortBy === 'expensive') return b.price - a.price;
        if (sortBy === 'az') return (a.name || "").localeCompare(b.name || "");
        if (sortBy === 'za') return (b.name || "").localeCompare(a.name || "");
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange, sortBy]);

  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;
  const currentItems = filteredProducts.slice(itemOffset, itemOffset + itemsPerPage);
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredProducts.length;
    setItemOffset(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="textWrapper" style={{margin: "auto"}}><p className="text">Loading...</p><div className="invertbox"></div></div>;

  return (
    <div className={`products-layout ${!showFilters ? 'no-sidebar' : ''}`}>
      {showFilters && (
        <aside className="filter-sidebar">
          <div className="filter-group">
            <h4>Qidiruv</h4>
            <input 
              type="text" 
              placeholder="Mahsulot nomi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <h4>Kategoriyalar</h4>
            <input 
              type="text" 
              placeholder="Kategoriyani topish..." 
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              className="filter-input-small"
            />
            <div className="category-scroll-box">
              {displayedCategories.map(cat => (
                <label key={cat} className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="category" 
                    checked={selectedCategory === cat}
                    onChange={() => { setSelectedCategory(cat); setItemOffset(0); }}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* BREND FILTERI */}
          <div className="filter-group">
            <h4>Brendlar</h4>
            <select 
              value={selectedBrand} 
              onChange={(e) => { setSelectedBrand(e.target.value); setItemOffset(0); }} 
              className="filter-select"
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h4>Saralash</h4>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="newest">🔥 Yangilari oldin</option>
              <option value="cheap">💸 Arzonroq</option>
              <option value="expensive">💎 Qimmatroq</option>
              <option value="az">🅰️ Alifbo (A-Z)</option>
              <option value="za">💤 Alifbo (Z-A)</option>
            </select>
          </div>

          <div className="filter-group">
            <h4>Narx (so'm)</h4>
            <div className="price-inputs">
              <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})} />
              <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})} />
            </div>
          </div>

          <button className="reset-filter" onClick={() => {
            setSelectedCategory('Barchasi');
            setSelectedBrand('Barchasi');
            setSearchTerm('');
            setCatSearch('');
            setPriceRange({ min: 0, max: 10000000 });
            setSortBy('newest');
          }}>
            Filtrni tozalash
          </button>
        </aside>
      )}

      <main className="products-main">
        {filteredProducts.length === 0 ? (
          <div className="no-products">Mahsulot topilmadi</div>
        ) : (
          <>
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
                activeClassName="selected"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Products;