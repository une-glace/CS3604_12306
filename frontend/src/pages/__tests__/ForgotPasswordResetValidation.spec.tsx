import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ForgotPasswordResetPage from '../ForgotPasswordResetPage';

describe('忘记密码-第三步交互校验', () => {
  test('2.1.7 非法密码显示错误且完成按钮不可点击', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password/reset"]}>
          <Routes>
            <Route path="/forgot-password/reset" element={<ForgotPasswordResetPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await user.type(screen.getByLabelText('新密码'), 'abc1');
    await user.type(screen.getByLabelText('密码确认'), 'abc1');
    expect(screen.getByText('密码需为8-20位，包含字母、数字与符号的组合')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled();
  });

  test('2.1.9 两次输入不一致提示并禁用完成按钮', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password/reset"]}>
          <Routes>
            <Route path="/forgot-password/reset" element={<ForgotPasswordResetPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await user.type(screen.getByLabelText('新密码'), 'Abcdef12!');
    await user.type(screen.getByLabelText('密码确认'), 'Abcdef12@');
    expect(screen.getByText('两次输入密码不一致')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled();
  });

  test('2.1.11 两项为空点击完成提示“请设置登录密码”', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password/reset"]}>
          <Routes>
            <Route path="/forgot-password/reset" element={<ForgotPasswordResetPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await user.click(screen.getByRole('button', { name: '完成' }));
    expect(screen.getByText('需为8-20位，包含字母、数字与符号的组合')).toBeInTheDocument();
  });

  test('2.1.12 第二个为空提示“请再次输入密码”并禁用', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password/reset"]}>
          <Routes>
            <Route path="/forgot-password/reset" element={<ForgotPasswordResetPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await user.type(screen.getByLabelText('新密码'), 'Abcdef12!');
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled();
  });

  test('2.1.13 两次合法一致密码使完成按钮可点击', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/forgot-password/reset"]}>
          <Routes>
            <Route path="/forgot-password/reset" element={<ForgotPasswordResetPage />} />
            <Route path="/forgot-password/done" element={<div data-testid="done" />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await user.type(screen.getByLabelText('新密码'), 'Abcdef12!');
    await user.type(screen.getByLabelText('密码确认'), 'Abcdef12!');
    expect(screen.getByRole('button', { name: '完成' })).not.toBeDisabled();
  });
});
