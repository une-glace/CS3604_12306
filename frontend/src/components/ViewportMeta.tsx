import { useEffect } from 'react';

const ViewportMeta: React.FC = () => {
  useEffect(() => {
    // 确保viewport meta标签存在并正确设置
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }, []);

  return null;
};

export default ViewportMeta;