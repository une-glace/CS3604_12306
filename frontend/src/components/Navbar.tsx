import React from 'react';

interface NavbarProps {
  active?: 'home' | 'tickets';
}

const Navbar: React.FC<NavbarProps> = ({ active }) => {
  const [isTicketOpen, setIsTicketOpen] = React.useState(false);
  const ticketTimerRef = React.useRef<number | null>(null);

  const handleTicketEnter = () => {
    if (ticketTimerRef.current) {
      clearTimeout(ticketTimerRef.current);
      ticketTimerRef.current = null;
    }
    setIsTicketOpen(true);
  };

  const handleTicketLeave = () => {
    if (ticketTimerRef.current) {
      clearTimeout(ticketTimerRef.current);
    }
    ticketTimerRef.current = window.setTimeout(() => {
      setIsTicketOpen(false);
      ticketTimerRef.current = null;
    }, 180);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <ul className="nav-links">
          <li><a href="/" className={active === 'home' ? 'active' : undefined}>首页</a></li>
          <li className="ticket-nav" onMouseEnter={handleTicketEnter} onMouseLeave={handleTicketLeave} onFocus={handleTicketEnter} onBlur={handleTicketLeave}>
            <a href="/train-list" className={active === 'tickets' ? 'active' : undefined}>车票</a>
            <div className={`ticket-dropdown ${isTicketOpen ? 'open' : ''}`} role="menu" aria-label="车票" onMouseEnter={handleTicketEnter} onMouseLeave={handleTicketLeave}>
              <div className="ticket-grid">
                <div className="ticket-col">
                  <div className="col-title">购买</div>
                  <a href="/train-list" className="ticket-item">单程</a>
                  <a href="#" className="ticket-item">往返</a>
                  <a href="#" className="ticket-item">中转换乘</a>
                  <a href="#" className="ticket-item">计次•定期票</a>
                </div>
                <div className="ticket-col">
                  <div className="col-title">变更</div>
                  <a href="#" className="ticket-item">退票</a>
                  <a href="#" className="ticket-item">改签</a>
                  <a href="#" className="ticket-item">变更到站</a>
                </div>
                <div className="ticket-col">
                  <div className="col-title">更多</div>
                  <a href="#" className="ticket-item">中铁银通卡</a>
                  <a href="#" className="ticket-item">国际列车</a>
                </div>
              </div>
            </div>
          </li>
          <li><a href="#">团购服务</a></li>
          <li><a href="#">会员服务</a></li>
          <li><a href="#">站车服务</a></li>
          <li><a href="#">商旅服务</a></li>
          <li><a href="#">出行指南</a></li>
          <li><a href="#">信息查询</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

