import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { mockUsers, type User } from '../../data/mockData';
import { toast } from 'sonner';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    maDocGia: '',
    hoTen: '',
    ngaySinh: '',
    phai: 'Nam',
    diaChi: '',
    dienThoai: '',
    avatar: '',
    email: '',
    currentBorrowedCount: 0
  });

  const filteredUsers = users.filter((user) =>
    user.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.maDocGia.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        maDocGia: `DG${String(users.length + 1).padStart(3, '0')}`,
        hoTen: '',
        ngaySinh: '',
        phai: 'Nam',
        diaChi: '',
        dienThoai: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        email: '',
        currentBorrowedCount: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      setUsers(users.map(u => u.maDocGia === editingUser.maDocGia ? formData as User : u));
      toast.success('Cập nhật độc giả thành công!');
    } else {
      setUsers([...users, formData as User]);
      toast.success('Thêm độc giả mới thành công!');
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (maDocGia: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa độc giả này?')) {
      setUsers(users.filter(u => u.maDocGia !== maDocGia));
      toast.success('Xóa độc giả thành công!');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Độc giả</h1>
          <p className="mt-1 text-gray-600">Quản lý thông tin độc giả thư viện</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm độc giả mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Chỉnh sửa độc giả' : 'Thêm độc giả mới'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Cập nhật thông tin độc giả hiện tại' : 'Thêm một độc giả mới vào thư viện'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maDocGia">Mã độc giả</Label>
                  <Input
                    id="maDocGia"
                    value={formData.maDocGia}
                    onChange={(e) => setFormData({ ...formData, maDocGia: e.target.value })}
                    disabled={!!editingUser}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phai">Phái</Label>
                  <Select
                    value={formData.phai}
                    onValueChange={(value: 'Nam' | 'Nữ') => setFormData({ ...formData, phai: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="hoTen">Họ tên</Label>
                <Input
                  id="hoTen"
                  value={formData.hoTen}
                  onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ngaySinh">Ngày sinh</Label>
                  <Input
                    id="ngaySinh"
                    type="date"
                    value={formData.ngaySinh}
                    onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dienThoai">Điện thoại</Label>
                  <Input
                    id="dienThoai"
                    value={formData.dienThoai}
                    onChange={(e) => setFormData({ ...formData, dienThoai: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="diaChi">Địa chỉ</Label>
                <Input
                  id="diaChi"
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, mã độc giả, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>Mã ĐG</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Ngày sinh</TableHead>
              <TableHead>Phái</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead className="text-center">Đang mượn</TableHead>
              <TableHead className="text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.maDocGia}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.hoTen} />
                    <AvatarFallback>{user.hoTen.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.maDocGia}</TableCell>
                <TableCell>{user.hoTen}</TableCell>
                <TableCell>{new Date(user.ngaySinh).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>{user.phai}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-xs">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs">{user.dienThoai}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{user.diaChi}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      user.currentBorrowedCount >= 3
                        ? 'bg-red-100 text-red-700'
                        : user.currentBorrowedCount > 0
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {user.currentBorrowedCount}/3
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.maDocGia)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          Không tìm thấy độc giả nào
        </div>
      )}
    </div>
  );
}