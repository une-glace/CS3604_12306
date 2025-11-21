import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterConditions from '../FilterConditions';

describe('FilterConditions', () => {
  test('emits filters for D-动车 and 一等座', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(<FilterConditions currentDate={'2025-12-15'} onFiltersChange={onFiltersChange} />);
    const dCheckbox = screen.getByText('D-动车').previousElementSibling as HTMLInputElement;
    await user.click(dCheckbox);
    const firstClassCheckbox = screen.getByText('一等座').previousElementSibling as HTMLInputElement;
    await user.click(firstClassCheckbox);
    expect(onFiltersChange).toHaveBeenCalled();
    const calls = onFiltersChange.mock.calls.map(c => c[0]);
    const last = calls[calls.length - 1];
    expect(last.trainTypes.includes('D')).toBe(true);
    expect(last.seatTypes.includes('first_class')).toBe(true);
  });
});