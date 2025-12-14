const { Address } = require('../models');

const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.findAll({
      where: { user_id: userId },
      order: [['is_default', 'DESC'], ['created_at', 'ASC']]
    });
    res.json({
      success: true,
      data: addresses.map(a => ({
        id: a.id,
        recipient: a.recipient_name,
        phone: a.phone_number,
        region: a.region,
        detail: a.detail,
        zipcode: a.zipcode,
        isDefault: a.is_default
      }))
    });
  } catch (e) {
    console.error('获取地址失败:', e);
    res.status(500).json({ success: false, message: '获取地址失败' });
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipient, phone, region, detail, zipcode, isDefault } = req.body;
    if (!recipient || !phone || !region || !detail) {
      return res.status(400).json({ success: false, message: '请填写完整的地址信息' });
    }
    if (isDefault) {
      await Address.update({ is_default: false }, { where: { user_id: userId } });
    }
    const created = await Address.create({
      user_id: userId,
      recipient_name: recipient,
      phone_number: phone,
      region,
      detail,
      zipcode,
      is_default: !!isDefault
    });
    res.status(201).json({
      success: true,
      message: '添加地址成功',
      data: {
        id: created.id,
        recipient: created.recipient_name,
        phone: created.phone_number,
        region: created.region,
        detail: created.detail,
        zipcode: created.zipcode,
        isDefault: created.is_default
      }
    });
  } catch (e) {
    console.error('添加地址失败:', e);
    res.status(500).json({ success: false, message: '添加地址失败' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const target = await Address.findOne({ where: { id, user_id: userId } });
    if (!target) {
      return res.status(404).json({ success: false, message: '地址不存在' });
    }
    await target.destroy();
    res.json({ success: true, message: '删除地址成功' });
  } catch (e) {
    console.error('删除地址失败:', e);
    res.status(500).json({ success: false, message: '删除地址失败' });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  deleteAddress
};
