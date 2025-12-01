import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPasswordVerifyPage from '../ForgotPasswordVerifyPage';
import ForgotPasswordResetPage from '../ForgotPasswordResetPage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as Auth from '../../services/auth';

describe('忘记密码-手机找回-第二步', () => {
  test('输入正确验证码并提交后进入第三步', async () => {
    const user = userEvent.setup();
    vi.spyOn(Auth, 'sendPhoneCode').mockResolvedValue({ success: true, message: 'ok' } as unknown as Awaited<ReturnType<typeof Auth.sendPhoneCode>>);
    vi.spyOn(Auth, 'verifyPhoneCode').mockResolvedValue({ success: true, message: 'ok' } as unknown as Awaited<ReturnType<typeof Auth.verifyPhoneCode>>);
    render(
      <MemoryRouter initialEntries={["/forgot-password/verify"]}>
        <Routes>
          <Route path="/forgot-password/verify" element={<AuthProvider><ForgotPasswordVerifyPage /></AuthProvider>} />
          <Route path="/forgot-password/reset" element={<AuthProvider><ForgotPasswordResetPage /></AuthProvider>} />
        </Routes>
      </MemoryRouter>
    );

    const { container } = render(
      <MemoryRouter initialEntries={["/forgot-password/verify"]}>
        <Routes>
          <Route path="/forgot-password/verify" element={<AuthProvider><ForgotPasswordVerifyPage /></AuthProvider>} />
          <Route path="/forgot-password/reset" element={<AuthProvider><ForgotPasswordResetPage /></AuthProvider>} />
        </Routes>
      </MemoryRouter>
    );

    const codeInput = container.querySelector('.fp-code') as HTMLInputElement;
    await user.type(codeInput, '123456');
    const submitBtn = container.querySelector('.fp-submit') as HTMLButtonElement;
    await user.click(submitBtn);

    expect(await screen.findByText('新密码：')).toBeInTheDocument();
  });
});
