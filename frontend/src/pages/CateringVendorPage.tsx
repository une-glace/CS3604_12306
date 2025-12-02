import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';
import './CateringVendorPage.css';

type Product = { name: string; price: string; image: string };

const BRAND_PRODUCTS: Record<string, Product[]> = {
  '永和大王': [
    { name: '特惠地瓜丸', price: '￥2.90', image: '/Food/永和大王/特惠地瓜丸.jpg' },
    { name: '蜂蜜柚子饮', price: '￥14.90', image: '/Food/永和大王/蜂蜜柚子饮.jpg' },
    { name: '咖喱牛腩饭柚子饮套餐', price: '￥58.90', image: '/Food/永和大王/咖喱牛腩饭柚子饮套餐.jpg' },
    { name: '双人超值套餐A', price: '￥99.00', image: '/Food/永和大王/双人超值套餐A.jpg' }
  ],
  '德克士': [
    { name: '左宗棠鸡味炸鸡饭套餐', price: '￥55.00', image: '/Food/德克士/左宗棠鸡味炸鸡饭套餐.jpg' },
    { name: '经典脆爽双鸡堡套餐', price: '￥36.00', image: '/Food/德克士/经典脆爽双鸡堡套餐.jpg' },
    { name: '经典脆爽双鸡堡', price: '￥18.00', image: '/Food/德克士/经典脆爽双鸡煲.jpg' },
    { name: '脆皮鸡腿堡套餐（柠香）', price: '￥51.00', image: '/Food/德克士/脆皮鸡腿堡套餐（柠香）.jpg' }
  ],
  '真功夫': [
    { name: '阳光番茄牛腩饭+元气乌鸡汤+田园彩豆', price: '￥53.00', image: '/Food/真功夫/阳光番茄牛腩饭+元气乌鸡汤+田园彩豆.jpg' },
    { name: '鲜辣排骨饭+香滑蒸蛋+田园彩豆', price: '￥46.00', image: '/Food/真功夫/鲜辣排骨饭+香滑蒸蛋+田园彩豆.jpg' },
    { name: '香汁排骨饭+乌鸡汤+田园彩豆', price: '￥53.00', image: '/Food/真功夫/香汁排骨饭+乌鸡汤+田园彩豆.jpg' }
  ],
  '康师傅': [
    { name: '嫩煎厚切牛肉杂粮饭', price: '￥52.00', image: '/Food/康师傅/嫩煎厚切牛肉杂粮饭.jpg' },
    { name: '蒲烧鳗鱼杂粮饭', price: '￥57.00', image: '/Food/康师傅/蒲烧鳗鱼杂粮饭.jpg' },
    { name: '嫩煎厚切牛肉杂粮饭可乐两件套', price: '￥65.00', image: '/Food/康师傅/嫩煎厚切牛肉杂粮饭可乐两件套.jpg' },
    { name: '蒲烧鳗鱼杂粮饭可乐两件套', price: '￥70.00', image: '/Food/康师傅/蒲烧鳗鱼杂粮饭可乐两件套.jpg' }
  ],
  '麦当劳': [
    { name: '只爱甜的便民套餐乘运款', price: '￥25.00', image: '/Food/麦当劳/只爱甜的便民套餐乘运款.jpg' },
    { name: '麦麦脆汁鸡（鸡腿）1块', price: '￥16.00', image: '/Food/麦当劳/麦麦脆汁鸡（鸡腿）1块.jpg' },
    { name: '香芋派', price: '￥9.00', image: '/Food/麦当劳/香芋派.jpg' },
    { name: '鸡牛双堡双人餐乘运款', price: '￥90.00', image: '/Food/麦当劳/鸡牛双堡双人餐乘运款.jpg' }
  ],
  '老娘舅': [
    { name: '新台式卤肉饭', price: '￥28.00', image: '/Food/老娘舅/新台式卤肉饭.jpg' },
    { name: '绍兴梅干菜烧肉套餐', price: '￥48.00', image: '/Food/老娘舅/绍兴梅干菜烧肉套餐.jpg' },
    { name: '鱼香肉丝套餐', price: '￥39.00', image: '/Food/老娘舅/鱼香肉丝套餐.jpg' }
  ]
};

const BRAND_INFO: Record<string, { phone: string; hours: string }> = {
  '永和大王': { phone: '021-51511025', hours: '09:30-19:30' },
  '老娘舅': { phone: '15800835487', hours: '10:00-20:00' },
  '麦当劳': { phone: '021-34688815', hours: '09:30-20:00' },
  '真功夫': { phone: '15901816438', hours: '10:00-20:00' },
  '德克士': { phone: '021-64969050', hours: '09:30-20:00' },
  '康师傅': { phone: '021-64969056', hours: '09:30-20:00' }
};

const CateringVendorPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const name = params.get('name') || '永和大王（上海虹桥站店）';
  const brand = params.get('brand') || '永和大王';
  const minOrder = params.get('min') || '￥0.00';
  const deliveryFee = params.get('fee') || '￥8.00';
  const stopOrder = params.get('stop') || '12-02 09:00';
  const cancelStop = params.get('cancel') || '12-02 09:00';

  const products = BRAND_PRODUCTS[brand] || BRAND_PRODUCTS['永和大王'];
  const vendorPhone = (BRAND_INFO[brand]?.phone) || '021-51511025';
  const vendorHours = (BRAND_INFO[brand]?.hours) || '09:30-19:30';
  const [activeTab, setActiveTab] = React.useState<'goods' | 'reviews' | 'merchant'>('goods');
  const DEFAULT_CATEGORIES: string[] = [
    '全部','新品','热销','销量王','卤肉饭系列','特色菜套餐','咖喱系','商务套餐','小炒系列','便民套餐','三件套超值套餐','家庭多人分享套餐','四件套超值套餐','佐食','二件套超值套餐','饮料','单点饭类'
  ];
  const LNJ_CATEGORIES: string[] = ['全部','新品','热销','热销推荐','商务套餐','超值套餐','饮料套餐','副食小吃','再来一碗','甜品饮料','便民套餐'];
  const MCD_CATEGORIES: string[] = ['全部','新品','热销','单人四件套','单人三件套','双人分享餐','小食组合','单品小食','便民套餐'];
  const DKS_CATEGORIES: string[] = ['全部','新品','热销','饮料自选','发票请联系','汉堡单点','德意饭庄','炸鸡','小食','汉堡套餐','一桶美味'];
  const KSF_CATEGORIES: string[] = ['全部','新品','热销','开发票联系','面条米饭单点','私房饮品任选','私房小食任选','臻味私房套餐','私房大大套餐','私房米饭套餐','私房捞面套餐','至尊金牌套餐','单独加面加饭'];
  const ZGF_CATEGORIES: string[] = ['全部','新品','热销','真功夫营养套餐含蒸蛋','真功夫营养套餐含汤'];
  const categories: string[] = brand === '老娘舅' ? LNJ_CATEGORIES : brand === '麦当劳' ? MCD_CATEGORIES : brand === '德克士' ? DKS_CATEGORIES : brand === '康师傅' ? KSF_CATEGORIES : brand === '真功夫' ? ZGF_CATEGORIES : DEFAULT_CATEGORIES;

  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');
  const handleProfileClick = () => navigate('/profile');
  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="vendor-page">
      <header className="header">
        <div className="header-container header-top">
          <div className="brand">
            <img className="brand-logo" alt="中国铁路12306" src="/铁路12306-512x512.png" />
            <div className="brand-text">
              <div className="brand-title">中国铁路12306</div>
              <div className="brand-subtitle">12306 CHINA RAILWAY</div>
            </div>
          </div>
          <div className="header-search">
            <input className="search-input" placeholder="搜索车票、 餐饮、 常旅客、 相关规章" type="text" />
            <button className="search-button">Q</button>
          </div>
          <div className="header-links">
            <a href="#" className="link">无障碍</a>
            <span className="sep">|</span>
            <a href="#" className="link">敬老版</a>
            <span className="sep">|</span>
            <a href="#" className="link">English</a>
            <span className="sep">|</span>
            <button className="link-btn" onClick={handleProfileClick}>我的12306</button>
            <span className="sep">|</span>
            {isLoggedIn ? (
              <>
                <button className="link-btn" onClick={handleProfileClick}>您好，{user?.realName || '用户'}</button>
                <span className="sep">|</span>
                <button className="link-btn" onClick={handleLogout}>退出</button>
              </>
            ) : (
              <>
                <button className="link-btn" onClick={handleLoginClick}>登录</button>
                <span className="space" />
                <button className="link-btn" onClick={handleRegisterClick}>注册</button>
              </>
            )}
          </div>
        </div>
      </header>

      <Navbar />

      <main className="vendor-main">
        <div className="vendor-breadcrumb">商旅服务 &gt; 餐饮•特产 &gt; {name}</div>
        <section className="vendor-header">
          <div className="vendor-header-left">
            <img className="vendor-avatar" src={`/Food/${brand}.jpg`} alt={brand} />
            <div className="vendor-info">
              <div className="vendor-title">{name}</div>
              <div className="vendor-meta-row">
                <span className="stars">★★★★★</span>
                <span className="meta-dot">·</span>
                <span className="phone">{vendorPhone}</span>
                <span className="meta-dot">·</span>
                <span className="hours">营业时间：{vendorHours}</span>
              </div>
            </div>
          </div>
          <div className="vendor-header-right">
            <div className="metric-col">
              <div className="metric-title">起送费</div>
              <div className="metric-value">{minOrder}</div>
            </div>
            <div className="metric-col">
              <div className="metric-title">配送费</div>
              <div className="metric-value">{deliveryFee}</div>
            </div>
            <div className="metric-col">
              <div className="metric-line"><div className="metric-title">下单截止</div><div className="metric-value">{stopOrder}</div></div>
              <div className="metric-line"><div className="metric-title">退单截止</div><div className="metric-value">{cancelStop}</div></div>
            </div>
          </div>
        </section>

        <section className="vendor-products">
          <div className="vendor-tabs">
            <button className={`tab ${activeTab === 'goods' ? 'active' : ''}`} onClick={() => setActiveTab('goods')}>所有商品</button>
            <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>评价</button>
            <button className={`tab ${activeTab === 'merchant' ? 'active' : ''}`} onClick={() => setActiveTab('merchant')}>商家</button>
          </div>
          <div className="tab-divider" />
          <div className="category-bar">
            {categories.map((c, i) => (
              <a key={i} className="category-item">{c}</a>
            ))}
          </div>
          <div className="products-grid">
            {products.map((p, i) => (
              <div key={i} className="product-card">
                <img src={p.image} alt={p.name} />
                <div className="product-name">{p.name}</div>
                <div className="product-price">{p.price}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CateringVendorPage;
