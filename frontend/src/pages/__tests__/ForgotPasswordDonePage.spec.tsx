import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPasswordDonePage from '../ForgotPasswordDonePage';
import { AuthProvider } from '../../contexts/AuthContext';

describe('忘记密码-手机找回-第四步', () => {
  test('点击登录系统进入登录页', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/forgot-password/done"]}>
        <Routes>
          <Route path="/forgot-password/done" element={<AuthProvider><ForgotPasswordDonePage /></AuthProvider>} />
          <Route path="/login" element={<div data-testid="login" />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByText('登录系统'));
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });
});
