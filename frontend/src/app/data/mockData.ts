// Mock data for Happy Library Admin Dashboard

export interface User {
  maDocGia: string;
  hoTen: string;
  ngaySinh: string;
  phai: 'Nam' | 'Nữ';
  diaChi: string;
  dienThoai: string;
  avatar: string;
  email: string;
  currentBorrowedCount: number;
}

export interface Book {
  maSach: string;
  tenSach: string;
  donGia: number;
  soQuyen: number;
  namXuatBan: number;
  maNXB: string;
  tacGia: string;
  coverImage: string;
  category: string;
}

export interface Publisher {
  maNXB: string;
  tenNXB: string;
}

export interface Borrowing {
  id: string;
  maDocGia: string;
  maSach: string;
  ngayMuon: string;
  ngayHenTra: string;
  ngayTra: string | null;
  trangThai: 'Chờ duyệt' | 'Đang mượn' | 'Đã trả' | 'Quá hạn' | 'Mất sách';
  tienPhat: number;
}

export interface Admin {
  msnv: string;
  hoTen: string;
  chucVu: string;
  password: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  sender: 'user' | 'admin';
}

export interface ChatConversation {
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

export const mockUsers: User[] = [
  {
    maDocGia: 'DG001',
    hoTen: 'Nguyễn Văn An',
    ngaySinh: '1995-03-15',
    phai: 'Nam',
    diaChi: '123 Lê Lợi, Q1, TP.HCM',
    dienThoai: '0901234567',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=An',
    email: 'nguyenvanan@gmail.com',
    currentBorrowedCount: 2
  },
  {
    maDocGia: 'DG002',
    hoTen: 'Trần Thị Bình',
    ngaySinh: '1998-07-22',
    phai: 'Nữ',
    diaChi: '456 Nguyễn Huệ, Q1, TP.HCM',
    dienThoai: '0912345678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Binh',
    email: 'tranbirth@gmail.com',
    currentBorrowedCount: 3
  },
  {
    maDocGia: 'DG003',
    hoTen: 'Lê Minh Cường',
    ngaySinh: '2000-11-05',
    phai: 'Nam',
    diaChi: '789 Hai Bà Trưng, Q3, TP.HCM',
    dienThoai: '0923456789',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cuong',
    email: 'leminhcuong@gmail.com',
    currentBorrowedCount: 1
  },
  {
    maDocGia: 'DG004',
    hoTen: 'Phạm Thị Dung',
    ngaySinh: '1997-04-18',
    phai: 'Nữ',
    diaChi: '321 Võ Văn Tần, Q3, TP.HCM',
    dienThoai: '0934567890',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dung',
    email: 'phamthidung@gmail.com',
    currentBorrowedCount: 0
  }
];

export const mockPublishers: Publisher[] = [
  { maNXB: 'NXB001', tenNXB: 'NXB Trẻ' },
  { maNXB: 'NXB002', tenNXB: 'NXB Kim Đồng' },
  { maNXB: 'NXB003', tenNXB: 'NXB Văn Học' },
  { maNXB: 'NXB004', tenNXB: 'NXB Thế Giới' },
  { maNXB: 'NXB005', tenNXB: 'NXB Tổng Hợp TP.HCM' }
];

export const mockBooks: Book[] = [
  {
    maSach: 'S001',
    tenSach: 'Đắc Nhân Tâm',
    donGia: 85000,
    soQuyen: 15,
    namXuatBan: 2020,
    maNXB: 'NXB001',
    tacGia: 'Dale Carnegie',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
    category: 'Kỹ năng sống'
  },
  {
    maSach: 'S002',
    tenSach: 'Sapiens: Lược Sử Loài Người',
    donGia: 195000,
    soQuyen: 8,
    namXuatBan: 2019,
    maNXB: 'NXB004',
    tacGia: 'Yuval Noah Harari',
    coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=400&fit=crop',
    category: 'Lịch sử'
  },
  {
    maSach: 'S003',
    tenSach: 'Nhà Giả Kim',
    donGia: 79000,
    soQuyen: 20,
    namXuatBan: 2021,
    maNXB: 'NXB003',
    tacGia: 'Paulo Coelho',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop',
    category: 'Văn học'
  },
  {
    maSach: 'S004',
    tenSach: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
    donGia: 110000,
    soQuyen: 0,
    namXuatBan: 2018,
    maNXB: 'NXB001',
    tacGia: 'Nguyễn Nhật Ánh',
    coverImage: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=300&h=400&fit=crop',
    category: 'Văn học Việt Nam'
  },
  {
    maSach: 'S005',
    tenSach: 'Tuổi Thơ Dữ Dội',
    donGia: 95000,
    soQuyen: 12,
    namXuatBan: 2020,
    maNXB: 'NXB001',
    tacGia: 'Phùng Quán',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
    category: 'Văn học Việt Nam'
  },
  {
    maSach: 'S006',
    tenSach: 'Cây Cam Ngọt Của Tôi',
    donGia: 108000,
    soQuyen: 5,
    namXuatBan: 2019,
    maNXB: 'NXB005',
    tacGia: 'José Mauro de Vasconcelos',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    category: 'Văn học'
  }
];

export const mockBorrowings: Borrowing[] = [
  {
    id: 'BR001',
    maDocGia: 'DG001',
    maSach: 'S001',
    ngayMuon: '2026-03-25',
    ngayHenTra: '2026-04-08',
    ngayTra: null,
    trangThai: 'Đang mượn',
    tienPhat: 0
  },
  {
    id: 'BR002',
    maDocGia: 'DG001',
    maSach: 'S002',
    ngayMuon: '2026-03-28',
    ngayHenTra: '2026-04-11',
    ngayTra: null,
    trangThai: 'Quá hạn',
    tienPhat: 10000
  },
  {
    id: 'BR003',
    maDocGia: 'DG002',
    maSach: 'S003',
    ngayMuon: '2026-04-01',
    ngayHenTra: '2026-04-15',
    ngayTra: null,
    trangThai: 'Chờ duyệt',
    tienPhat: 0
  },
  {
    id: 'BR004',
    maDocGia: 'DG002',
    maSach: 'S005',
    ngayMuon: '2026-03-20',
    ngayHenTra: '2026-04-03',
    ngayTra: null,
    trangThai: 'Đang mượn',
    tienPhat: 0
  },
  {
    id: 'BR005',
    maDocGia: 'DG002',
    maSach: 'S006',
    ngayMuon: '2026-03-15',
    ngayHenTra: '2026-03-29',
    ngayTra: '2026-03-28',
    trangThai: 'Đã trả',
    tienPhat: 0
  },
  {
    id: 'BR006',
    maDocGia: 'DG003',
    maSach: 'S001',
    ngayMuon: '2026-04-05',
    ngayHenTra: '2026-04-19',
    ngayTra: null,
    trangThai: 'Đang mượn',
    tienPhat: 0
  }
];

export const mockAdmins: Admin[] = [
  {
    msnv: 'ADMIN001',
    hoTen: 'Quản trị viên Hệ thống',
    chucVu: 'Quản lý',
    password: 'admin123'
  },
  {
    msnv: 'NV001',
    hoTen: 'Nguyễn Thị Mai',
    chucVu: 'Thủ thư',
    password: 'thuthu123'
  }
];

export const mockChatConversations: ChatConversation[] = [
  {
    userId: 'DG001',
    userName: 'Nguyễn Văn An',
    lastMessage: 'Cho em hỏi sách "Đắc Nhân Tâm" còn không ạ?',
    timestamp: '2026-04-10T10:30:00',
    unread: 1
  },
  {
    userId: 'DG003',
    userName: 'Lê Minh Cường',
    lastMessage: 'Em muốn gia hạn thêm sách được không ạ?',
    timestamp: '2026-04-10T09:15:00',
    unread: 0
  },
  {
    userId: 'DG004',
    userName: 'Phạm Thị Dung',
    lastMessage: 'Cảm ơn anh/chị nhiều!',
    timestamp: '2026-04-09T16:45:00',
    unread: 0
  }
];

export const mockChatMessages: { [key: string]: ChatMessage[] } = {
  'DG001': [
    {
      id: 'msg1',
      userId: 'DG001',
      userName: 'Nguyễn Văn An',
      message: 'Xin chào, cho em hỏi sách "Đắc Nhân Tâm" còn không ạ?',
      timestamp: '2026-04-10T10:30:00',
      sender: 'user'
    },
    {
      id: 'msg2',
      userId: 'DG001',
      userName: 'Admin',
      message: 'Chào bạn! Hiện tại thư viện còn 15 quyển sách "Đắc Nhân Tâm". Bạn có muốn mượn không?',
      timestamp: '2026-04-10T10:31:00',
      sender: 'admin'
    }
  ],
  'DG003': [
    {
      id: 'msg3',
      userId: 'DG003',
      userName: 'Lê Minh Cường',
      message: 'Em muốn gia hạn thêm sách được không ạ?',
      timestamp: '2026-04-10T09:15:00',
      sender: 'user'
    },
    {
      id: 'msg4',
      userId: 'DG003',
      userName: 'Admin',
      message: 'Được bạn nhé! Bạn đang mượn sách nào cần gia hạn?',
      timestamp: '2026-04-10T09:16:00',
      sender: 'admin'
    }
  ],
  'DG004': [
    {
      id: 'msg5',
      userId: 'DG004',
      userName: 'Phạm Thị Dung',
      message: 'Cho em hỏi cách đăng ký thẻ thư viện ạ?',
      timestamp: '2026-04-09T16:30:00',
      sender: 'user'
    },
    {
      id: 'msg6',
      userId: 'DG004',
      userName: 'Admin',
      message: 'Bạn có thể đăng ký thẻ trực tuyến bằng tài khoản Gmail của mình nhé!',
      timestamp: '2026-04-09T16:35:00',
      sender: 'admin'
    },
    {
      id: 'msg7',
      userId: 'DG004',
      userName: 'Phạm Thị Dung',
      message: 'Cảm ơn anh/chị nhiều!',
      timestamp: '2026-04-09T16:45:00',
      sender: 'user'
    }
  ]
};

// Helper functions
export const getUserById = (maDocGia: string): User | undefined => {
  return mockUsers.find(u => u.maDocGia === maDocGia);
};

export const getBookById = (maSach: string): Book | undefined => {
  return mockBooks.find(b => b.maSach === maSach);
};

export const getPublisherById = (maNXB: string): Publisher | undefined => {
  return mockPublishers.find(p => p.maNXB === maNXB);
};
