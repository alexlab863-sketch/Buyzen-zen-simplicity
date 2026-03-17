import "./Style/ProductStyle.css";

export default function Card({ products }) {
    return (
        <div className="card-container"> 
            {products.map(product => (
                <li key={product.id} className="card-item"> 
                    <img src={product.image} alt={product.title}  className="card-image" />
                    <div className="card-content"> 
                        <h3 className="card-title">{product.title}</h3> 
                        <p className="card-price">Narx: ${product.price}</p> 
                       
                    </div>
                </li>
            ))}
        </div>
    );
}