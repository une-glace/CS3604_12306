import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ForgotPasswordPage from '../ForgotPasswordPage';
import ForgotPasswordVerifyPage from '../ForgotPasswordVerifyPage';

describe('忘记密码-手机找回-第一步', () => {
  test('填写合法账户信息并提交后进入第二步', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password"]}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/forgot-password/verify" element={<ForgotPasswordVerifyPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await user.type(screen.getByLabelText('手机号码'), '15540255343');
    await user.type(screen.getByLabelText('证件号码'), '100111222233334443');
    await user.click(screen.getByRole('button', { name: '提交' }));

    await screen.findByText('请填写手机验证码：', undefined, { timeout: 2000 });
    expect(screen.getByText('请填写手机验证码：')).toBeInTheDocument();
  });
});