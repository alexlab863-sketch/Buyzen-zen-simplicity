import MyCarousel from "./HomePageCarousel";
import Products from "../products/Products";

export default function HomePage() {
    return (
        <div className="home-page">
           <MyCarousel/>
           <h2>Bizda mavjud bo'lgan mahsulotlar</h2>
         <Products showFilters={false}/>
        </div>
        
    );
}