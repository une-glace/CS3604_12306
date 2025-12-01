import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPasswordPage from '../ForgotPasswordPage';
import ForgotPasswordVerifyPage from '../ForgotPasswordVerifyPage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as Auth from '../../services/auth';

describe('忘记密码-手机找回-第一步', () => {
  test('填写合法账户信息并提交后进入第二步', async () => {
    const user = userEvent.setup();
    vi.spyOn(Auth, 'validateResetAccount').mockResolvedValue({ success: true, message: 'ok' } as unknown as Awaited<ReturnType<typeof Auth.validateResetAccount>>);
    const { container } = render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<AuthProvider><ForgotPasswordPage /></AuthProvider>} />
          <Route path="/forgot-password/verify" element={<AuthProvider><ForgotPasswordVerifyPage /></AuthProvider>} />
        </Routes>
      </MemoryRouter>
    );

    const inputs = container.querySelectorAll('.fp-input');
    if (inputs.length >= 2) {
      await user.type(inputs[0] as HTMLInputElement, '15540255343');
      await user.type(inputs[1] as HTMLInputElement, '100111222233334443');
    }
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(await screen.findByText('请填写手机验证码：')).toBeInTheDocument();
  });
});
