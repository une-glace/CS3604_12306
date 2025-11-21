import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as AuthCtx from '../../contexts/AuthContext';
import ProfilePage from '../ProfilePage';

describe('ProfilePage', () => {
  test('redirects to login when not logged in', () => {
    const spy = vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    } as unknown as ReturnType<typeof AuthCtx.useAuth>);
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<div data-testid="login" />} />
        </Routes>
      </MemoryRouter>
    );
    spy.mockRestore();
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });
});