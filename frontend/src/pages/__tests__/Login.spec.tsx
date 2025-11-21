import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as Auth from '../../services/auth';
import type { User } from '../../types/user';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../../components/Login';

describe('Login component', () => {
  test('valid credentials navigate to profile', async () => {
    const user = userEvent.setup();
    type LoginResp = Awaited<ReturnType<typeof Auth.loginUser>>;
    const userObj: User = { username: 'u', realName: 'U', idNumber: 'X', phoneNumber: 'P' } as User;
    const resp: LoginResp = { success: true, message: 'ok', data: { user: userObj, token: 't' } };
    vi.spyOn(Auth, 'loginUser').mockResolvedValue(resp);
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<AuthProvider><Login onNavigateToRegister={() => {}} /></AuthProvider>} />
          <Route path="/profile" element={<div data-testid="profile" />} />
        </Routes>
      </MemoryRouter>
    );
    await user.type(screen.getByPlaceholderText('请输入用户名或邮箱'), 'newuser');
    await user.type(screen.getByPlaceholderText('请输入密码'), 'mypassword');
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: '立即登录' }));
    alertMock.mockRestore();
    expect(screen.getByTestId('profile')).toBeInTheDocument();
  });
});