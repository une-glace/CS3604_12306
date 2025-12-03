import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ForgotPasswordDonePage from '../ForgotPasswordDonePage';

describe('忘记密码-手机找回-第四步', () => {
  test('点击登录系统进入登录页', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password/done"]}>
          <Routes>
            <Route path="/forgot-password/done" element={<ForgotPasswordDonePage />} />
            <Route path="/login" element={<div data-testid="login" />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await user.click(screen.getByText('登录系统'));
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });
});
