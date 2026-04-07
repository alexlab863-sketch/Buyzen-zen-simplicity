import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';

// Swiper stillarini import qilamiz
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// O'zimizning alohida CSS faylimiz
import './Style/HomeStyle.css';

const MyCarousel = () => {
  const slides = [
    {
      id: 1,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShD_cf8QTkgt9R7kVBXJzwV82S-9hbExcckQ&s",
      title: "Bizda hamma narsa topliadi",
      description: ""
    },
    {
      id: 2,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIxQ0q1VRFvACRnD0FmEm3pPFf05Iw5TS53g&s",
      title: "Har Juma kuni optom narxlar!",
      description: "Faqat bizda eng yaxshi narxlar"
    },
    {
      id: 3,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRKQbp2A_2H9CbqveFxjNvjc9Mdi21IHjGUA&s",
      title: "Yangi To'plam",
      description: "O'z uslubingizni biz bilan toping"
    }
  ];

  return (
    <div className="carousel-container">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect={'fade'} // Yumshoq o'tish effekti
        speed={1000}
        loop={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        className="mySwiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="slide-content">
              <img className='carousel-img' src={slide.image} alt={slide.title} />
              <div className="image-overlay">
                <div className="text-content">
                  <h2>{slide.title}</h2>
                  <p>{slide.description}</p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MyCarousel;