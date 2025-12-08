import { get, post, del } from './api';

export interface AddressItem {
  id: string;
  recipient: string;
  phone: string;
  region: string;
  detail: string;
  isDefault?: boolean;
}

export interface AddressFormData {
  recipient: string;
  phone: string;
  region: string;
  detail: string;
  isDefault?: boolean;
}

export const getAddresses = async (): Promise<AddressItem[]> => {
  const resp = await get('/addresses');
  return resp.data || [];
};

export const addAddress = async (data: AddressFormData): Promise<AddressItem> => {
  const resp = await post('/addresses', data);
  return resp.data;
};

export const deleteAddress = async (id: string): Promise<void> => {
  await del(`/addresses/${id}`);
};
