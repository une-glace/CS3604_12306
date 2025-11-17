import React, { useState } from 'react';
import './AddPassengerModal.css';

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: '成人' | '儿童' | '学生';
}

interface AddPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (passenger: Omit<Passenger, 'id'>) => void;
  onEdit?: (id: string, passenger: Omit<Passenger, 'id'>) => void;
  editingPassenger?: Passenger | null;
}

const AddPassengerModal: React.FC<AddPassengerModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  onEdit,
  editingPassenger 
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    idCard: string;
    phone: string;
    passengerType: '成人' | '儿童' | '学生';
    idType?: string;
  }>({
    name: editingPassenger?.name || '',
    idCard: editingPassenger?.idCard || '',
    phone: editingPassenger?.phone || '',
    passengerType: editingPassenger?.passengerType || '成人',
    idType: '1'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
    } else if (!/^[\u4e00-\u9fa5·]+$/.test(formData.name.trim())) {
      newErrors.name = '姓名需为中文（可包含·）';
    }
    
    if (!formData.idCard.trim()) {
      newErrors.idCard = '请输入身份证号';
    } else if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(formData.idCard)) {
      newErrors.idCard = '身份证号格式不正确';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '手机号格式不正确';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        name: formData.name,
        idCard: formData.idCard,
        phone: formData.phone,
        passengerType: formData.passengerType,
        idType: formData.idType || '1'
      };
      
      if (editingPassenger && onEdit) {
        onEdit(editingPassenger.id, submitData);
      } else {
        onAdd(submitData);
      }
      setFormData({ name: '', idCard: '', phone: '', passengerType: '成人', idType: '1' });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingPassenger ? '编辑乘车人' : '添加乘车人'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {/* 通知栏 */}
        <div className="notification-banner">
          <div className="notification-icon">⚠</div>
          <div className="notification-text">
            如旅客身份信息未能在添加后的24小时内通过核验，请乘车人持有效身份证原件到车站办理身份核验。
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="passenger-form">
          {/* 基本信息 */}
          <div className="form-section">
            <h4 className="section-title">基本信息</h4>
            
            <div className="form-group">
              <label htmlFor="idType">* 证件类型：</label>
              <select
                id="idType"
                value={formData.idType || '1'}
                onChange={(e) => handleInputChange('idType', e.target.value)}
              >
                <option value="1">居民身份证</option>
                <option value="2">外国人永久身份证</option>
                <option value="3">港澳台居民身份证</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">* 姓名：</label>
              <div className="input-with-help">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入姓名"
                  className={errors.name ? 'error' : ''}
                />
                <a href="#" className="help-link" onClick={(e) => e.preventDefault()}>姓名填写规则（用于身份核验）</a>
              </div>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="idCard">* 证件号码：</label>
              <div className="input-with-help">
                <input
                  type="text"
                  id="idCard"
                  value={formData.idCard}
                  onChange={(e) => handleInputChange('idCard', e.target.value)}
                  placeholder=""
                  maxLength={18}
                  className={errors.idCard ? 'error' : ''}
                />
                <span className="help-text">用于身份核验，请正确填写。</span>
              </div>
              {errors.idCard && <span className="error-message">{errors.idCard}</span>}
            </div>
          </div>

          {/* 联系方式 */}
          <div className="form-section">
            <h4 className="section-title">联系方式(请提供乘车人真实有效的联系方式)</h4>
            
            <div className="form-group">
              <label htmlFor="phone">手机号码：</label>
              <div className="phone-input-group">
                <select className="country-code">
                  <option value="+86">+86</option>
                </select>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="请输入手机号码"
                  maxLength={11}
                  className={errors.phone ? 'error' : ''}
                />
              </div>
              <div className="contact-notice">
                请您填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          {/* 附加信息 */}
          <div className="form-section">
            <h4 className="section-title">附加信息</h4>
            
            <div className="form-group">
              <label htmlFor="passengerType">* 优惠(待)类型：</label>
              <select
                id="passengerType"
                value={formData.passengerType}
                onChange={(e) => handleInputChange('passengerType', e.target.value)}
              >
                <option value="成人">成人</option>
                <option value="儿童">儿童</option>
                <option value="学生">学生</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="save-btn submit-btn">
              {editingPassenger ? '保存' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPassengerModal;
