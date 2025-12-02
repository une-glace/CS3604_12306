import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ForgotPasswordVerifyPage from '../ForgotPasswordVerifyPage';
import ForgotPasswordResetPage from '../ForgotPasswordResetPage';

describe('忘记密码-手机找回-第二步', () => {
  test('输入正确验证码并提交后进入第三步', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password/verify"]}>
          <Routes>
            <Route path="/forgot-password/verify" element={<ForgotPasswordVerifyPage />} />
            <Route path="/forgot-password/reset" element={<ForgotPasswordResetPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    
    const codeInput = screen.getByLabelText('验证码');
    await user.type(codeInput, '123456');
    await user.click(screen.getByRole('button', { name: '获取手机验证码' }));
    await user.click(screen.getByRole('button', { name: '提交' }));

    await screen.findByText('新密码：', undefined, { timeout: 2000 });
    expect(screen.getByText('新密码：')).toBeInTheDocument();
  });
});