Cấu trúc thư mục BACKEND.
happy-library-backend/
├── server.js ← Entry point, Socket.io setup
├── config/
│ └── passport.js ← Google OAuth Strategy
├── models/
│ ├── User.model.js
│ ├── Book.model.js
│ ├── Publisher.model.js
│ ├── BorrowRecord.model.js
│ └── ChatMessage.model.js
├── controllers/
│ ├── auth.controller.js ← Google OAuth → JWT
│ ├── book.controller.js ← CRUD + Tìm kiếm
│ ├── borrow.controller.js ← ⭐ Toàn bộ nghiệp vụ mượn/trả
│ ├── publisher.controller.js
│ ├── user.controller.js
│ └── chat.controller.js
├── routes/
│ ├── auth.routes.js
│ ├── book.routes.js
│ ├── borrow.routes.js
│ ├── publisher.routes.js
│ ├── user.routes.js
│ └── chat.routes.js
└── middleware/
└── auth.middleware.js ← protect + adminOnly
