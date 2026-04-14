import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Library, Lock, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { mockAdmins } from '../../data/mockData';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const [msnv, setMsnv] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login delay
    setTimeout(() => {
      const admin = mockAdmins.find(
        (a) => a.msnv === msnv && a.password === password
      );

      if (admin) {
        localStorage.setItem('happyLibraryAdmin', JSON.stringify(admin));
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      } else {
        toast.error('Mã nhân viên hoặc mật khẩu không đúng!');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Library className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Happy Library
          </h2>
          <p className="mt-2 text-gray-600">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="msnv">Mã số nhân viên</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="msnv"
                  type="text"
                  value={msnv}
                  onChange={(e) => setMsnv(e.target.value)}
                  placeholder="Nhập MSNV"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-center text-sm text-gray-600">
            Demo: <span className="font-semibold">ADMIN001</span> / <span className="font-semibold">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
