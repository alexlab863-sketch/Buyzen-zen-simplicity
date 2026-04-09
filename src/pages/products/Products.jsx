import { useState, useEffect, useMemo } from 'react';
import Card from './Card';
import ReactPaginate from 'react-paginate'; 
import { supabase } from '../../supabaseClient';
import { CATEGORY_OPTIONS } from '../../constants/categories';
import { BRAND_OPTIONS } from '../../constants/brands';

const Paginate = ReactPaginate.default ? ReactPaginate.default : ReactPaginate;

function Products({ showFilters = true }) { // Katta F bilan yozgan ma'qul
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [selectedBrand, setSelectedBrand] = useState('Barchasi');
  const [selectedSort, setSelectedSort] = useState('created_desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '10000000' });

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
    const productCategories = [...new Set(products.map((p) => p.category))].filter(Boolean);
    const merged = [...new Set([...CATEGORY_OPTIONS, ...productCategories])];
    return ['Barchasi', ...merged];
  }, [products]);

  const brands = useMemo(() => {
    const productBrands = [...new Set(products.map((p) => p.brand))].filter(Boolean);
    const merged = [...new Set([...BRAND_OPTIONS, ...productBrands])];
    return ['Barchasi', ...merged];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const minPrice = priceRange.min === '' ? 0 : Number(priceRange.min);
    const maxPrice = priceRange.max === '' ? Number.POSITIVE_INFINITY : Number(priceRange.max);

    return products
      .filter(p => {
        const matchesCategory = selectedCategory === 'Barchasi' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'Barchasi' || p.brand === selectedBrand;
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = (p.price || 0) >= minPrice && (p.price || 0) <= maxPrice;
        return matchesCategory && matchesBrand && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (selectedSort === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '', 'uz');
        }
        if (selectedSort === 'name_desc') {
          return (b.name || '').localeCompare(a.name || '', 'uz');
        }
        if (selectedSort === 'price_asc') {
          return (a.price || 0) - (b.price || 0);
        }
        if (selectedSort === 'price_desc') {
          return (b.price || 0) - (a.price || 0);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [products, searchTerm, selectedCategory, selectedBrand, selectedSort, priceRange]);

  const [itemOffset, setItemOffset] = useState(0);
  const itemsPerPage = 8;
  const currentItems = filteredProducts.slice(itemOffset, itemOffset + itemsPerPage);
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredProducts.length;
    setItemOffset(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="textWrapper" style={{margin: "auto"}}>
  <p className="text">Loading...</p>
  <div className="invertbox"></div>
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
            <h4>Narx oralig'i</h4>
            <div className="price-inputs">
              <input 
                type="number" 
                placeholder="0"
                value={priceRange.min}
                onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="10000000"
                value={priceRange.max}
                onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                onFocus={(e) => {
                  if (priceRange.max === '10000000') {
                    setPriceRange({ ...priceRange, max: '' });
                  }
                }}
                onBlur={() => {
                  if (priceRange.max === '') {
                    setPriceRange({ ...priceRange, max: '10000000' });
                  }
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <h4>Kategoriya</h4>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setItemOffset(0);
              }}
              className="filter-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h4>Brand</h4>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setItemOffset(0);
              }}
              className="filter-select"
            >
              {brands.map((brandName) => (
                <option key={brandName} value={brandName}>
                  {brandName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h4>Sortlash</h4>
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setItemOffset(0);
              }}
              className="filter-select"
            >
              <option value="created_desc">Eng yangilari</option>
              <option value="name_asc">Nomi: A-Z</option>
              <option value="name_desc">Nomi: Z-A</option>
              <option value="price_asc">Narx: o'sish</option>
              <option value="price_desc">Narx: kamayish</option>
            </select>
          </div>

          <button className="reset-filter" onClick={() => {
            setSelectedCategory('Barchasi');
            setSelectedBrand('Barchasi');
            setSelectedSort('created_desc');
            setSearchTerm('');
            setPriceRange({ min: '', max: '10000000' });
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
