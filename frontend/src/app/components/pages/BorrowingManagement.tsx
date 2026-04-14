import { useState } from 'react';
import { Search, FileDown, Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../ui/breadcrumb';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { mockBorrowings, mockUsers, mockBooks, getUserById, getBookById, type Borrowing } from '../../data/mockData';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';

type StatusFilter = 'Tất cả' | 'Chờ duyệt' | 'Đang mượn' | 'Đã trả' | 'Quá hạn' | 'Mất sách';

interface BorrowBookItem {
  bookId: string;
  quantity: number;
}

export function BorrowingManagement() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>(mockBorrowings);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [borrowDate, setBorrowDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [note, setNote] = useState('');
  const [borrowBooks, setBorrowBooks] = useState<BorrowBookItem[]>([{ bookId: '', quantity: 1 }]);
  const [saveAndContinue, setSaveAndContinue] = useState(false);

  const filteredBorrowings = borrowings.filter((b) => {
    const matchStatus = statusFilter === 'Tất cả' ? true : b.trangThai === statusFilter;
    const user = getUserById(b.maDocGia);
    const matchSearch = searchQuery === '' ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.maDocGia.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.hoTen.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusColors = {
    'Chờ duyệt': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Đang mượn': 'bg-green-100 text-green-700 border-green-200',
    'Đã trả': 'bg-blue-100 text-blue-700 border-blue-200',
    'Quá hạn': 'bg-red-100 text-red-700 border-red-200',
    'Mất sách': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const handleAddBook = () => {
    setBorrowBooks([...borrowBooks, { bookId: '', quantity: 1 }]);
  };

  const handleRemoveBook = (index: number) => {
    if (borrowBooks.length > 1) {
      setBorrowBooks(borrowBooks.filter((_, i) => i !== index));
    }
  };

  const handleSaveBorrow = () => {
    if (!selectedUserId || !borrowDate || !returnDate || borrowBooks.some(b => !b.bookId)) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const user = getUserById(selectedUserId);
    if (user && user.currentBorrowedCount >= 3) {
      toast.error('Độc giả này đã mượn tối đa 3 cuốn sách!');
      return;
    }

    // Create new borrowing records
    const newBorrowings = borrowBooks.map((item, index) => ({
      id: `PM${Date.now()}${index}`,
      maDocGia: selectedUserId,
      maSach: item.bookId,
      ngayMuon: borrowDate,
      ngayHenTra: returnDate,
      ngayTra: null,
      trangThai: 'Chờ duyệt' as const,
      tienPhat: 0
    }));

    setBorrowings([...borrowings, ...newBorrowings]);
    toast.success('Thêm phiếu mượn thành công!');

    if (!saveAndContinue) {
      setAddDialogOpen(false);
    }

    // Reset form
    setSelectedUserId('');
    setBorrowDate('');
    setReturnDate('');
    setNote('');
    setBorrowBooks([{ bookId: '', quantity: 1 }]);
  };

  const calculateOverdueDays = (ngayHenTra: string): number => {
    const today = new Date('2026-04-13');
    const dueDate = new Date(ngayHenTra);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Thư viện số</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Quản lý mượn, trả</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mượn sách</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title */}
      <h1 className="mb-6 text-2xl">Mượn sách</h1>

      {/* Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6 bg-white border-b rounded-none h-auto p-0">
          <TabsTrigger
            value="list"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-600 px-6 py-3"
          >
            Danh sách phiếu mượn
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-600 px-6 py-3"
          >
            Quản lý lịch mượn trả
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          {/* Filter and Search Bar */}
          <div className="mb-4 bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Bộ lọc</span>
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="-- Chọn trạng thái --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tất cả">-- Chọn trạng thái --</SelectItem>
                  <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
                  <SelectItem value="Đang mượn">Đang mượn</SelectItem>
                  <SelectItem value="Đã trả">Đã trả</SelectItem>
                  <SelectItem value="Quá hạn">Quá hạn</SelectItem>
                  <SelectItem value="Mất sách">Mất sách</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder="Họ và tên, số phiếu, mã thẻ"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              <Button className="bg-green-600 hover:bg-green-700">
                <Search className="h-4 w-4 mr-2" />
                Tìm kiếm
              </Button>

              <div className="ml-auto flex gap-2">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  <FileDown className="h-4 w-4 mr-2" />
                  Xuất excel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mới
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[60px] text-center border-r">STT</TableHead>
                  <TableHead className="border-r">Số phiếu</TableHead>
                  <TableHead className="border-r min-w-[200px]">Thông tin bạn đọc</TableHead>
                  <TableHead className="border-r">Đối tượng</TableHead>
                  <TableHead className="border-r">Ngày hẹn mượn trả</TableHead>
                  <TableHead className="border-r text-center w-[100px]">Số lượng mượn</TableHead>
                  <TableHead className="border-r text-center w-[100px]">Số lượng giao</TableHead>
                  <TableHead className="border-r text-center w-[100px]">Số lượng trả</TableHead>
                  <TableHead className="border-r text-center">Trạng thái</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBorrowings.map((borrowing, index) => {
                  const user = getUserById(borrowing.maDocGia);
                  const book = getBookById(borrowing.maSach);
                  const overdueDays = borrowing.trangThai === 'Quá hạn' ? calculateOverdueDays(borrowing.ngayHenTra) : 0;

                  return (
                    <TableRow key={borrowing.id}>
                      <TableCell className="text-center border-r">{index + 1}</TableCell>
                      <TableCell className="border-r font-medium">{borrowing.id}</TableCell>
                      <TableCell className="border-r">
                        <div className="text-sm space-y-0.5">
                          <div className="text-gray-600">Mã thẻ: <span className="text-gray-900">{borrowing.maDocGia}</span></div>
                          <div className="text-gray-600">Họ tên: <span className="text-gray-900">{user?.hoTen}</span></div>
                          <div className="text-gray-600">Ngày sinh: <span className="text-gray-900">{user ? new Date(user.ngaySinh).toLocaleDateString('vi-VN') : '-'}</span></div>
                          <div className="text-gray-600">Lớp/Phòng ban: <span className="text-gray-900">-</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r">Độc giả</TableCell>
                      <TableCell className="border-r whitespace-nowrap">
                        {new Date(borrowing.ngayMuon).toLocaleDateString('vi-VN')} - {new Date(borrowing.ngayHenTra).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="border-r text-center">1</TableCell>
                      <TableCell className="border-r text-center">
                        {borrowing.trangThai === 'Chờ duyệt' ? '0' : '1'}
                      </TableCell>
                      <TableCell className="border-r text-center">
                        {borrowing.trangThai === 'Đã trả' ? '1' : '0'}
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="flex justify-center">
                          <Badge variant="outline" className={`${statusColors[borrowing.trangThai]} border`}>
                            {borrowing.trangThai}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-green-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-green-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredBorrowings.length === 0 && (
            <div className="bg-white rounded-lg border py-12 text-center text-gray-500">
              Không có dữ liệu phiếu mượn
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
            Chức năng Quản lý lịch mượn trả đang được phát triển
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Borrow Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm mới phiếu mượn</DialogTitle>
            <DialogDescription>
              Điền thông tin để tạo phiếu mượn mới cho độc giả
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700">
                  Bạn đọc <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="-- Chọn --" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map((user) => (
                      <SelectItem key={user.maDocGia} value={user.maDocGia}>
                        {user.hoTen} ({user.maDocGia})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700">
                  Ngày mượn <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-gray-700">
                  Ngày hẹn trả <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Ghi chú</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1.5 min-h-[100px]"
                placeholder="Nhập ghi chú..."
              />
            </div>

            <div className="border-t pt-6">
              <div className="grid grid-cols-12 gap-4 mb-3 text-sm font-medium text-gray-700">
                <div className="col-span-5">
                  Nhân đề <span className="text-red-500">*</span>
                </div>
                <div className="col-span-4">Thông tin sách</div>
                <div className="col-span-2">
                  Số lượng mượn <span className="text-red-500">*</span>
                </div>
                <div className="col-span-1">Hành động</div>
              </div>

              {borrowBooks.map((item, index) => {
                const selectedBook = getBookById(item.bookId);
                return (
                  <div key={index} className="grid grid-cols-12 gap-4 mb-3">
                    <div className="col-span-5">
                      <Select
                        value={item.bookId}
                        onValueChange={(value) => {
                          const newBooks = [...borrowBooks];
                          newBooks[index].bookId = value;
                          setBorrowBooks(newBooks);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Chọn --" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockBooks.filter(b => b.soQuyen > 0).map((book) => (
                            <SelectItem key={book.maSach} value={book.maSach}>
                              {book.tenSach}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        readOnly
                        value={selectedBook ? `${selectedBook.tacGia} - ${selectedBook.category}` : ''}
                        placeholder="Thông tin sách"
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newBooks = [...borrowBooks];
                          newBooks[index].quantity = parseInt(e.target.value) || 1;
                          setBorrowBooks(newBooks);
                        }}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBook(index)}
                        className="text-gray-400 hover:text-red-600"
                        disabled={borrowBooks.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddBook}
                className="mt-2 text-green-600 border-green-600 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm
              </Button>
            </div>

            <div className="border-t pt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="save-continue"
                  checked={saveAndContinue}
                  onCheckedChange={(checked) => setSaveAndContinue(checked as boolean)}
                />
                <label
                  htmlFor="save-continue"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Lưu và thêm tiếp
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleSaveBorrow}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}