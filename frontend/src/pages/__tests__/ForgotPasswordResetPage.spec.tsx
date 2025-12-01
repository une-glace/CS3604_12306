import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPasswordResetPage from '../ForgotPasswordResetPage';
import ForgotPasswordDonePage from '../ForgotPasswordDonePage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as Auth from '../../services/auth';

describe('忘记密码-手机找回-第三步', () => {
  test('符合策略的新密码与确认提交后进入完成页', async () => {
    const user = userEvent.setup();
    vi.spyOn(Auth, 'resetPassword').mockResolvedValue({ success: true, message: 'ok' } as unknown as Awaited<ReturnType<typeof Auth.resetPassword>>);
    render(
      <MemoryRouter initialEntries={["/forgot-password/reset"]}>
        <Routes>
          <Route path="/forgot-password/reset" element={<AuthProvider><ForgotPasswordResetPage /></AuthProvider>} />
          <Route path="/forgot-password/done" element={<AuthProvider><ForgotPasswordDonePage /></AuthProvider>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('新密码'), 'Abcdef12!');
    await user.type(screen.getByLabelText('密码确认'), 'Abcdef12!');
    await user.click(screen.getByRole('button', { name: '完成' }));

    expect(await screen.findByText('新密码设置成功，您可以使用新密码登录系统！')).toBeInTheDocument();
  });
});
