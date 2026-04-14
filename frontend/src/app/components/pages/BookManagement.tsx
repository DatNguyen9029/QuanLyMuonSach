import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { mockBooks, mockPublishers, type Book } from '../../data/mockData';
import { toast } from 'sonner';

export function BookManagement() {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Partial<Book>>({
    maSach: '',
    tenSach: '',
    donGia: 0,
    soQuyen: 0,
    namXuatBan: new Date().getFullYear(),
    maNXB: '',
    tacGia: '',
    coverImage: '',
    category: ''
  });

  const filteredBooks = books.filter((book) =>
    book.tenSach.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.tacGia.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.maSach.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVoiceSearch = () => {
    toast.info('Tính năng tìm kiếm bằng giọng nói đang được phát triển');
  };

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData(book);
    } else {
      setEditingBook(null);
      setFormData({
        maSach: `S${String(books.length + 1).padStart(3, '0')}`,
        tenSach: '',
        donGia: 0,
        soQuyen: 0,
        namXuatBan: new Date().getFullYear(),
        maNXB: '',
        tacGia: '',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
        category: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBook) {
      // Update existing book
      setBooks(books.map(b => b.maSach === editingBook.maSach ? formData as Book : b));
      toast.success('Cập nhật sách thành công!');
    } else {
      // Add new book
      setBooks([...books, formData as Book]);
      toast.success('Thêm sách mới thành công!');
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (maSach: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sách này?')) {
      setBooks(books.filter(b => b.maSach !== maSach));
      toast.success('Xóa sách thành công!');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Sách</h1>
          <p className="mt-1 text-gray-600">Quản lý kho sách thư viện</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm sách mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
              </DialogTitle>
              <DialogDescription>
                {editingBook ? 'Cập nhật thông tin sách' : 'Nhập thông tin sách mới'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maSach">Mã sách</Label>
                  <Input
                    id="maSach"
                    value={formData.maSach}
                    onChange={(e) => setFormData({ ...formData, maSach: e.target.value })}
                    disabled={!!editingBook}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Thể loại</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tenSach">Tên sách</Label>
                <Input
                  id="tenSach"
                  value={formData.tenSach}
                  onChange={(e) => setFormData({ ...formData, tenSach: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tacGia">Tác giả</Label>
                <Input
                  id="tacGia"
                  value={formData.tacGia}
                  onChange={(e) => setFormData({ ...formData, tacGia: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="donGia">Đơn giá (VNĐ)</Label>
                  <Input
                    id="donGia"
                    type="number"
                    value={formData.donGia}
                    onChange={(e) => setFormData({ ...formData, donGia: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="soQuyen">Số quyển</Label>
                  <Input
                    id="soQuyen"
                    type="number"
                    value={formData.soQuyen}
                    onChange={(e) => setFormData({ ...formData, soQuyen: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="namXuatBan">Năm xuất bản</Label>
                  <Input
                    id="namXuatBan"
                    type="number"
                    value={formData.namXuatBan}
                    onChange={(e) => setFormData({ ...formData, namXuatBan: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maNXB">Nhà xuất bản</Label>
                <Select
                  value={formData.maNXB}
                  onValueChange={(value) => setFormData({ ...formData, maNXB: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà xuất bản" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPublishers.map((pub) => (
                      <SelectItem key={pub.maNXB} value={pub.maNXB}>
                        {pub.tenNXB}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="coverImage">URL ảnh bìa</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingBook ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên sách, tác giả, mã sách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleVoiceSearch}>
          <Mic className="h-5 w-5" />
        </Button>
      </div>

      {/* Books Table */}
      <div className="rounded-lg border bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh bìa</TableHead>
              <TableHead>Mã sách</TableHead>
              <TableHead>Tên sách</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Thể loại</TableHead>
              <TableHead>Năm XB</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-center">Số lượng tồn</TableHead>
              <TableHead className="text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.map((book) => (
              <TableRow key={book.maSach}>
                <TableCell>
                  <img
                    src={book.coverImage}
                    alt={book.tenSach}
                    className="h-16 w-12 rounded object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{book.maSach}</TableCell>
                <TableCell>{book.tenSach}</TableCell>
                <TableCell>{book.tacGia}</TableCell>
                <TableCell>{book.category}</TableCell>
                <TableCell>{book.namXuatBan}</TableCell>
                <TableCell className="text-right">
                  {book.donGia.toLocaleString('vi-VN')} ₫
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      book.soQuyen === 0
                        ? 'bg-red-100 text-red-700'
                        : book.soQuyen < 5
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {book.soQuyen}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(book)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(book.maSach)}
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

      {filteredBooks.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          Không tìm thấy sách nào
        </div>
      )}
    </div>
  );
}