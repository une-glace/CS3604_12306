import React, { useState, useEffect } from 'react'
import './Carousel.css'

interface CarouselItem {
  id: number
  image: string
  title: string
  link?: string
}

interface CarouselProps {
  items: CarouselItem[]
  autoPlay?: boolean
  interval?: number
}

const Carousel: React.FC<CarouselProps> = ({ 
  items, 
  autoPlay = true, 
  interval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // 自动轮播
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === items.length - 1 ? 0 : prevIndex + 1
      )
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, items.length])

  // 手动切换到指定索引
  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // 上一张
  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? items.length - 1 : currentIndex - 1)
  }

  // 下一张
  const goToNext = () => {
    setCurrentIndex(currentIndex === items.length - 1 ? 0 : currentIndex + 1)
  }

  if (!items || items.length === 0) {
    return (
      <div className="hero-carousel">
        <div className="hero-carousel-placeholder">
          <p>暂无轮播内容</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hero-carousel">
      {/* 轮播图片 */}
      <div className="hero-carousel-wrapper">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`hero-carousel-slide ${index === currentIndex ? 'active' : ''}`}
          >
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.image ? (
                  <img src={item.image} alt={item.title} />
                ) : (
                  <div className="hero-carousel-placeholder">{item.title}</div>
                )}
              </a>
            ) : (
              item.image ? (
                <img src={item.image} alt={item.title} />
              ) : (
                <div className="hero-carousel-placeholder">{item.title}</div>
              )
            )}
          </div>
        ))}
      </div>

      {/* 左右箭头 */}
      {items.length > 1 && (
        <>
          <button 
            className="hero-carousel-arrow hero-carousel-arrow-left"
            onClick={goToPrevious}
            aria-label="上一张"
          >
            &#8249;
          </button>
          <button 
            className="hero-carousel-arrow hero-carousel-arrow-right"
            onClick={goToNext}
            aria-label="下一张"
          >
            &#8250;
          </button>
        </>
      )}

      {/* 指示器 */}
      {items.length > 1 && (
        <div className="hero-carousel-indicators">
          {items.map((item, index) => (
            <button
              key={item.id}
              className={`hero-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`切换到第${index + 1}张`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Carousel