import "./Style/ProductStyle.css";

export default function Card({ products }) { 
    return (
        <div className="card-container"> 
            {products && products.map(product => (
                <div key={product.id} className="card-item"> 
                    <img src={product.thumbnail} alt={product.title} className="card-image" />
                    <div className="card-content"> 
                        <h3 className="card-title">{product.title}</h3> 
                        <p className="card-brand">{product.brand}</p>
                        <p className="card-price">Narx: ${product.price}</p> 
                    </div>
                    <button className="card-btn">Batafsil</button>
                </div>
            ))}
        </div>
    );
}