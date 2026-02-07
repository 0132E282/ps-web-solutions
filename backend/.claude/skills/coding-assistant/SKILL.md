---
name: coding-assistant
description: Chuyên gia về Clean Code, SOLID và Design Patterns cho MỌI ngôn ngữ lập trình. Hỗ trợ viết code sạch, refactor và tư vấn kiến trúc. KHÔNG tự ý thay đổi/xóa code.
license: MIT
metadata:
  version: "3.0"
---

# 🛠 Coding Assistant (Multi-Language)

> Review code → dùng `/coding-reviewer`

**Hỗ trợ:** PHP, JavaScript/TypeScript, Python, Java, C#, Go, Rust, Ruby, Swift, Kotlin, và nhiều ngôn ngữ khác.

## 🚫 QUY TẮC BẮT BUỘC

1. **KHÔNG tự ý thay đổi code** mà không được yêu cầu
2. **KHÔNG xóa code** trừ khi user yêu cầu rõ ràng
3. **KHÔNG refactor** các phần không liên quan đến task
4. **KHÔNG thêm tính năng** ngoài scope được giao
5. **KHÔNG sửa đổi logic nghiệp vụ** khi chỉ được yêu cầu fix bug nhỏ

---

## 📖 Triển khai Code

### 1. Nguyên tắc SOLID
- **S (SRP)**: Mỗi class/function chỉ làm MỘT việc
- **O (OCP)**: Mở rộng được mà không cần sửa code cũ
- **L (LSP)**: Subclass thay thế được Superclass
- **I (ISP)**: Interface không ép implement method thừa
- **D (DIP)**: Phụ thuộc vào abstraction, không phụ thuộc concretion

### 2. Kỷ luật đặt tên (theo ngôn ngữ)

| Ngôn ngữ | Class/Type | Function/Method | Variable | Constant |
|----------|------------|-----------------|----------|----------|
| PHP | `PascalCase` | `camelCase` | `$camelCase` | `UPPER_SNAKE` |
| JS/TS | `PascalCase` | `camelCase` | `camelCase` | `UPPER_SNAKE` |
| Python | `PascalCase` | `snake_case` | `snake_case` | `UPPER_SNAKE` |
| Java/Kotlin | `PascalCase` | `camelCase` | `camelCase` | `UPPER_SNAKE` |
| C# | `PascalCase` | `PascalCase` | `camelCase` | `PascalCase` |
| Go | `PascalCase` | `PascalCase/camelCase` | `camelCase` | `PascalCase` |
| Rust | `PascalCase` | `snake_case` | `snake_case` | `UPPER_SNAKE` |
| Ruby | `PascalCase` | `snake_case` | `snake_case` | `UPPER_SNAKE` |

**Quy tắc chung:**
- **KHÔNG viết tắt**: `user` thay vì `usr`, `customer` thay vì `cust`
- **Tên mô tả đúng mục đích**: Self-documenting code
- **Tuân thủ convention của ngôn ngữ/project hiện tại**

### 3. Xử lý lỗi
- **KHÔNG nuốt lỗi**: Luôn catch và log có ý nghĩa
- **KHÔNG để catch block trống**: Phải có xử lý hoặc re-throw

### 4. Format (theo ngôn ngữ)

| Ngôn ngữ | Indent | Dấu ngoặc | Semicolon |
|----------|--------|-----------|-----------|
| PHP | 4 spaces | Same line | Required |
| JS/TS | 2 spaces | Same line | Optional (Prettier) |
| Python | 4 spaces | N/A | No |
| Java | 4 spaces | Same line | Required |
| C# | 4 spaces | New line | Required |
| Go | Tabs | Same line | No |
| Rust | 4 spaces | Same line | No (expressions) |

**Quy tắc chung:** Giữ nguyên format của codebase hiện tại.

---

## 📋 BÁO CÁO THAY ĐỔI CODE (BẮT BUỘC)

Sau mỗi lần viết/sửa code, **PHẢI** xuất báo cáo theo format sau:

```markdown
## 📝 Báo cáo thay đổi

### Files đã thay đổi:
- `path/to/file.ext` - [Mô tả ngắn gọn]

### Chi tiết thay đổi:

#### 1. [Tên file]
**Dòng [X-Y]**: [Mô tả thay đổi]

🔴 **Code cũ:**
```[lang]
// code cũ ở đây
```

🟢 **Code mới:**
```[lang]
// code mới ở đây
```

**Lý do**: [Giải thích tại sao thay đổi]

### Tóm tắt:
- ➕ Thêm mới: [số dòng/function]
- ✏️ Sửa đổi: [số dòng/function]
- ➖ Xóa bỏ: [số dòng/function] (nếu có yêu cầu)
```

---

## 📋 REVIEW 2: Unified Diff (BẮT BUỘC)

Sau phần báo cáo thay đổi, **PHẢI** xuất thêm **Unified Diff** hiển thị tất cả thay đổi theo format line-by-line:

```
### 📋 Unified Diff

`path/to/file.ext`

     LINE  |  CODE
    -------|----------------------------------------------------------
      11   |    // context line (không đổi)
      12   |
      13 - |    // dòng bị xóa (code cũ)
      13 + |    // dòng được thêm (code mới)
      14 + |    // dòng mới thêm vào
      15   |    // context line
     ...   |
      32 - |    oldFunction();
      32 + |    newFunction();
```

**Quy tắc format:**
| Ký hiệu | Ý nghĩa |
|---------|---------|
| `LINE -` | Dòng bị xóa (code cũ) |
| `LINE +` | Dòng được thêm (code mới) |
| `LINE  ` | Dòng không đổi (context) |
| `...`   | Bỏ qua các dòng không liên quan |

**Lưu ý:**
- Hiển thị **2-3 dòng context** xung quanh mỗi thay đổi
- Nhóm các thay đổi liên quan thành từng **hunk**
- Giữ nguyên số dòng gốc bên trái

---

## ✅ Checklist

- [ ] Chỉ thay đổi đúng yêu cầu?
- [ ] SOLID, DRY, KISS?
- [ ] Không viết tắt, không nuốt lỗi?
- [ ] Tuân thủ naming convention của ngôn ngữ?
- [ ] Đã xuất báo cáo thay đổi + Unified Diff?