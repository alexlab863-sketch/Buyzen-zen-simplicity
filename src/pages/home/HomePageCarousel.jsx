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
      image: "https://wallpaperaccess.com/full/1131083.jpg",
      title: "Bizda hamma narsa topliadi",
      description: ""
    },
    {
      id: 2,
      image: "",
      title: "Har Juma kuni optom narxlar!",
      description: "Faqat bizda eng yaxshi narxlar"
    },
    {
      id: 3,
      image: "",
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
            <div className={`slide-content ${slide.image ? '' : 'slide-content-fallback'}`}>
              {slide.image ? (
                <img className='carousel-img' src={slide.image} alt={slide.title} />
              ) : null}
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
