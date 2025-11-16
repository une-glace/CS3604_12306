import React from 'react';
import '../pages/HomePage.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-bottom">
          <p>版权所有©2008-2025 中国铁道科学研究院集团有限公司 技术支持：铁旅科技有限公司</p>
          <p>公安 京公网安备 11010802038392号 | 京ICP备05020493号-4 | ICP证：京B2-20202537 | 营业执照</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;