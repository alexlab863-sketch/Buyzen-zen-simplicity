import "./Style/ProductStyle.css";
import { useNavigate } from "react-router-dom";


export default function Card({ products }) {
    const naviagate = useNavigate();
    function getproductid(id){
       naviagate(`/product/${id}`);
    }
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
                    <button className="card-btn" onClick={()=> {getproductid(product.id)}}>Batafsil</button>
                </div>
            
            ))}
        </div>
    );
}