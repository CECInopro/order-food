# chatBundle Upgrade Design

**Date:** 2026-04-16
**Status:** Approved

## Overview

Nâng cấp hệ thống chatBundle với 2 tính năng chính:
1. **Gửi file/ảnh** - Hỗ trợ upload qua socket (base64) và server
2. **Cải thiện UI/UX** - Typing indicator, seen receipts, timestamp thông minh, emoji picker, quick replies

---

## 1. Database Schema

### chatMessageModel (Update)

```javascript
{
    userId: { type: String, required: true, index: true },
    sender: { type: String, enum: ["user", "shop"], required: true },
    text: { type: String, required: true, maxlength: 2000 },
    // File fields (NEW)
    fileUrl: { type: String, default: null },
    fileType: { type: String, enum: ["image", "document", null], default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null },
    // Read status (UNIFIED)
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    // Timestamps
    createdAt: { type: Date, default: Date.now }
}
```

### quickReplyModel (New)

```javascript
{
    text: { type: String, required: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}
```

**Default quick replies:**
1. "Xin chào! Cảm ơn đã liên hệ"
2. "Đơn hàng của bạn đang được xử lý"
3. "Cảm ơn bạn đã đặt hàng!"
4. "Chúng tôi sẽ giao hàng trong 30-45 phút"

---

## 2. File Upload Strategy

| File Type | Size | Method |
|-----------|------|--------|
| Image ≤ 500KB | ≤ 512KB | Base64 via Socket |
| Any file > 500KB | > 512KB | Upload to Server |

**API Endpoint:** `POST /api/chat/upload`

**Request:** `multipart/form-data`
- `file`: File attachment

**Response:**
```json
{
    "success": true,
    "url": "/uploads/chat/abc123.jpg",
    "fileName": "photo.jpg",
    "fileSize": 1024000,
    "fileType": "image"
}
```

**Storage:** `back-end/uploads/chat/`

---

## 3. Socket Events

### New Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `chat:typing` | ↔ | `{ isTyping: boolean }` | Typing indicator |
| `chat:seen` | user→admin | `{ messageIds: string[] }` | Mark messages as read |
| `chat:read_all` | admin→user | `{ userId: string }` | Admin read all user messages |

### Updated Events

**`chat:new_message` payload (additions):**
```json
{
    "message": {
        "_id": "...",
        "text": "...",
        "fileUrl": "...",
        "fileType": "image",
        "fileName": "photo.jpg",
        "fileSize": 102400,
        "isRead": false,
        "readAt": null,
        ...
    },
    "userId": "...",
    "isTyping": false
}
```

---

## 4. API Endpoints

### User Routes (require auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/messages` | Get user's messages |
| GET | `/api/chat/unread` | Get unread count |
| POST | `/api/chat/upload` | Upload file/image |
| POST | `/api/chat/send` | Send message (fallback) |
| GET | `/api/chat/quick-replies` | Get active quick replies |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/admin/conversations` | List all conversations |
| GET | `/api/chat/admin/thread/:userId` | Get thread with user |
| POST | `/api/chat/admin/reply` | Send reply (fallback) |
| POST | `/api/chat/admin/upload` | Admin upload file |
| GET | `/api/chat/admin/quick-replies` | List all quick replies |
| POST | `/api/chat/admin/quick-replies` | Create quick reply |
| PUT | `/api/chat/admin/quick-replies/:id` | Update quick reply |
| DELETE | `/api/chat/admin/quick-replies/:id` | Delete quick reply |

---

## 5. UI User (ChatBubble)

### New Components

1. **Attachment Button** (📎)
   - Click to open file picker (images, documents)
   - Show preview before sending

2. **Emoji Picker**
   - Library: `emoji-picker-react`
   - Click emoji → insert at cursor position

3. **Typing Indicator**
   - Display: "Shop đang nhập tin nhắn..." with animated dots
   - Position: Above message list, aligned left

4. **Quick Replies Bar**
   - Horizontal scrollable chips below header
   - Click to send predefined message

5. **Smart Timestamps**
   ```
   < 1 min    → "Vừa xong"
   < 60 min   → "15 phút trước"
   < 24 hours → "14:30"
   ≥ 24 hours → "15/03"
   ```

6. **Seen Receipt**
   - Single checkmark (✓): Sent
   - Double checkmark (✓✓): Delivered
   - Blue checkmarks: Read

### Message Display

**Text Message:**
```
┌─────────────────────┐
│ Tin nhắn text       │
│              14:30 ✓✓
└─────────────────────┘
```

**Image Message:**
```
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │                 │ │
│ │   [IMG PREVIEW] │ │
│ │                 │ │
│ └─────────────────┘ │
│              14:30 ✓✓
└─────────────────────┘
```

**Document Message:**
```
┌─────────────────────┐
│ 📄 document.pdf     │
│    2.5 MB           │
│              14:30 ✓✓
└─────────────────────┘
```

---

## 6. UI Admin Panel

### New Features

1. **Typing Badge**
   - Show animated indicator on conversation item when user is typing

2. **Seen Receipts**
   - Blue ✓✓ on user messages when admin has read them

3. **Quick Reply Manager**
   - Table view: Text, Active toggle, Order, Actions
   - Add/Edit modal
   - Drag to reorder

4. **Notification Sound**
   - Play sound on new message (user-selectable, can mute)

5. **File Preview**
   - Images: Lightbox on click
   - Documents: Download button

---

## 7. Dependencies

### Frontend
```bash
npm install emoji-picker-react
```

### Backend
```bash
npm install multer
```

---

## 8. File Structure Changes

```
back-end/
├── controllers/
│   └── chatController.js      # + upload, quickReply CRUD
├── models/
│   ├── chatMessageModel.js    # + file fields
│   └── quickReplyModel.js     # NEW
├── routes/
│   └── chatRoute.js           # + upload, quickReply routes
├── socket/
│   └── chatSocket.js          # + typing, seen events
└── uploads/chat/             # NEW

front-end/src/component/ChatBubble/
├── ChatBubble.jsx             # Full rewrite with new features
└── ChatBubble.css             # New styles

admin/src/pages/Chat/
├── Chat.jsx                   # + typing, seen, quickReply management
├── Chat.css                   # + new styles
└── QuickReplyModal.jsx        # NEW
```

---

## 9. Implementation Priority

1. **Phase 1:** Database schema + file upload API
2. **Phase 2:** Socket events (typing, seen)
3. **Phase 3:** User UI (ChatBubble) - file, emoji, typing
4. **Phase 4:** Admin UI - typing badge, seen receipts
5. **Phase 5:** Quick replies management
6. **Phase 6:** Notification sound

---

## 10. Backward Compatibility

- Old messages without `fileUrl`/`isRead` fields continue to work
- API falls back to REST if socket fails
- File upload is optional - chat works without attachments
