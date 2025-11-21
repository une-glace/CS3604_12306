const app = require('./app');
const { testConnection, syncDatabase, Order, OrderPassenger, TrainSeat } = require('./models');
const { Op } = require('sequelize');
const { seedData } = require('./scripts/seedData');

const PORT = process.env.PORT || 3000;

(async () => {
  const server = app.listen(PORT, async () => {
    console.log(`🚄 12306 API Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);

    try {
      await testConnection();
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        await syncDatabase(false);
        await seedData();
      }
      const ttlMs = parseInt(process.env.ORDER_UNPAID_TTL_MS || '120000', 10);
      const intervalMs = parseInt(process.env.ORDER_CLEANUP_INTERVAL_MS || '30000', 10);
      let running = false;
      setInterval(async () => {
        if (running) return;
        running = true;
        try {
          const now = new Date();
          const cutoff = new Date(now.getTime() - ttlMs);
          const expired = await Order.findAll({
            where: { status: 'unpaid', createdAt: { [Op.lt]: cutoff } },
            include: [{ model: OrderPassenger, as: 'passengers' }]
          });
          const tasks = [];
          for (const order of expired) {
            const map = {};
            if (order.passengers && order.passengers.length) {
              for (const p of order.passengers) {
                const k = `${p.seatType}`;
                map[k] = (map[k] || 0) + 1;
              }
              for (const [seatType, count] of Object.entries(map)) {
                tasks.push((async () => {
                  const seat = await TrainSeat.findOne({ where: { trainNumber: order.trainNumber, date: order.departureDate, seatType } });
                  if (seat) await seat.update({ availableSeats: seat.availableSeats + count });
                })());
              }
            }
            tasks.push(order.update({ status: 'cancelled' }));
          }
          if (tasks.length) await Promise.all(tasks);
          const paid = await Order.findAll({ where: { status: 'paid' } });
          const updates = [];
          for (const order of paid) {
            try {
              if (!order.departureDate) continue;
              const d = new Date(order.departureDate);
              if (order.departureTime) {
                const [hh, mm] = String(order.departureTime).split(':');
                const h = parseInt(hh || '0', 10);
                const m = parseInt(mm || '0', 10);
                d.setHours(h, m, 0, 0);
              }
              if (now >= d) updates.push(order.update({ status: 'completed' }));
            } catch {}
          }
          if (updates.length) await Promise.all(updates);
        } finally {
          running = false;
        }
      }, intervalMs);
    } catch (e) {
      console.error('服务器启动初始化失败:', e.message);
    }
  });

  // 优雅关闭
  const shutdown = () => {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();