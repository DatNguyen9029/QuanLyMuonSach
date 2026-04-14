import { BookOpen, Users, BookCopy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { mockBooks, mockUsers, mockBorrowings } from '../../data/mockData';

export function Dashboard() {
  const totalBooks = mockBooks.reduce((sum, book) => sum + book.soQuyen, 0);
  const totalUsers = mockUsers.length;
  const activeBorrowings = mockBorrowings.filter(
    (b) => b.trangThai === 'Đang mượn' || b.trangThai === 'Chờ duyệt'
  ).length;
  const overdueBorrowings = mockBorrowings.filter(
    (b) => b.trangThai === 'Quá hạn'
  ).length;

  const stats = [
    {
      title: 'Tổng số sách',
      value: totalBooks,
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Độc giả',
      value: totalUsers,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Đang mượn',
      value: activeBorrowings,
      icon: BookCopy,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      title: 'Quá hạn',
      value: overdueBorrowings,
      icon: TrendingUp,
      color: 'text-red-600',
      bg: 'bg-red-100'
    }
  ];

  const recentBorrowings = mockBorrowings.slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Chào mừng đến với Happy Library</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-full ${stat.bg} p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động mượn sách gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBorrowings.map((borrowing) => {
                const user = mockUsers.find((u) => u.maDocGia === borrowing.maDocGia);
                const book = mockBooks.find((b) => b.maSach === borrowing.maSach);
                
                const statusColors = {
                  'Chờ duyệt': 'bg-blue-100 text-blue-700',
                  'Đang mượn': 'bg-orange-100 text-orange-700',
                  'Đã trả': 'bg-green-100 text-green-700',
                  'Quá hạn': 'bg-red-100 text-red-700',
                  'Mất sách': 'bg-gray-100 text-gray-700'
                };

                return (
                  <div key={borrowing.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{user?.hoTen}</p>
                      <p className="text-sm text-gray-600">{book?.tenSach}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[borrowing.trangThai]}`}>
                      {borrowing.trangThai}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sách được mượn nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBooks.slice(0, 5).map((book) => (
                <div key={book.maSach} className="flex items-center gap-4 border-b pb-4 last:border-0">
                  <img
                    src={book.coverImage}
                    alt={book.tenSach}
                    className="h-16 w-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{book.tenSach}</p>
                    <p className="text-sm text-gray-600">{book.tacGia}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Còn lại</p>
                    <p className="font-bold text-blue-600">{book.soQuyen}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
