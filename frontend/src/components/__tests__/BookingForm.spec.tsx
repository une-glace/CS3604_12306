import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingForm from '../BookingForm';

describe('BookingForm', () => {
  test('calls onSearch with valid inputs', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<BookingForm onSearch={onSearch} />);

    await user.type(screen.getByLabelText('出发地'), '北京南');
    await user.type(screen.getByLabelText('目的地'), '上海虹桥');
    const dateInput = screen.getByLabelText('出发日期') as HTMLInputElement;
    await user.type(dateInput, '2025-12-15');

    await user.click(screen.getByRole('button', { name: '查 询' }));
    expect(onSearch).toHaveBeenCalledWith({ from: '北京南', to: '上海虹桥', date: '2025-12-15' });
  });

  test('swap stations button swaps inputs', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<BookingForm onSearch={onSearch} />);
    await user.type(screen.getByLabelText('出发地'), '北京');
    await user.type(screen.getByLabelText('目的地'), '上海');
    await user.click(screen.getByTitle('交换出发地和目的地'));
    expect((screen.getByLabelText('出发地') as HTMLInputElement).value).toBe('上海');
    expect((screen.getByLabelText('目的地') as HTMLInputElement).value).toBe('北京');
  });

  test('alerts when inputs are incomplete', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<BookingForm />);
    await user.click(screen.getByRole('button', { name: '查 询' }));
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});