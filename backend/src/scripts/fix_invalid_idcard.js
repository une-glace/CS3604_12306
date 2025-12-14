const { sequelize } = require('../config/database');
const { OrderPassenger, Order, Passenger, User } = require('../models');

async function fixInvalidIdCards() {
  try {
    console.log('Starting ID card fix script...');
    
    // Find all order passengers
    const ops = await OrderPassenger.findAll({
      include: [{
        model: Order,
        as: 'order',
        include: [{
          model: User,
          as: 'user'
        }]
      }]
    });

    console.log(`Found ${ops.length} order passengers.`);

    let fixedCount = 0;

    for (const op of ops) {
      // Check if idCard is invalid
      // Valid ID card is usually 15 or 18 chars. "2" is definitely invalid.
      // Also check if it looks like a database ID (numeric and short)
      const isInvalid = !op.idCard || op.idCard.length < 15 || /^\d{1,10}$/.test(op.idCard);

      if (isInvalid) {
        console.log(`Found invalid idCard: "${op.idCard}" for passenger: ${op.passengerName} (Order ID: ${op.orderId})`);

        if (!op.order || !op.order.user) {
          console.warn(`Cannot fix: Missing order or user info for OrderPassenger ID ${op.id}`);
          continue;
        }

        const userId = op.order.userId;
        const name = op.passengerName;

        // Find correct passenger info
        const passenger = await Passenger.findOne({
          where: {
            user_id: userId,
            name: name
          }
        });

        if (passenger) {
          console.log(`Found matching passenger record. Updating idCard to: ${passenger.id_number}`);
          await op.update({ idCard: passenger.id_number });
          fixedCount++;
        } else {
          console.warn(`Could not find matching passenger record for user ${userId} and name ${name}`);
        }
      }
    }

    console.log(`Finished. Fixed ${fixedCount} records.`);

  } catch (error) {
    console.error('Error running script:', error);
  } finally {
    await sequelize.close();
  }
}

fixInvalidIdCards();
