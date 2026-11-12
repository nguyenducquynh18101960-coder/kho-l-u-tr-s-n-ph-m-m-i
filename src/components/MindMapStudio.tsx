import React, { useState, useEffect, useRef } from 'react';
import {
  GitFork,
  Sparkles,
  Search,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  Zap,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  RotateCw,
  Share2,
  Info,
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
} from 'lucide-react';
import { GradeLevel, MindMapData, MindMapNode } from '../types';

interface MindMapStudioProps {
  currentGrade: GradeLevel;
  onSendToChat?: (text: string) => void;
  isDark: boolean;
}

// Built-in high-quality starter mindmaps for instant learning
const DEFAULT_PRESETS: Partial<Record<GradeLevel, MindMapData[]>> = {
  'Lớp 9': [
    {
      id: 'viet-toan-9',
      topic: 'Hệ thức Vi-ét & Phương trình bậc hai',
      grade: 'Lớp 9',
      subject: 'Toán học',
      centralTheme: 'HỆ THỨC VI-ÉT & PT BẬC HAI (TOÁN 9)',
      summary: 'Nền tảng 1.5 - 2.0 điểm trong đề thi vào 10, kết hợp điều kiện có nghiệm, biểu thức đối xứng và tham số m.',
      root: {
        id: 'root',
        title: 'Hệ thức Vi-ét & Phương trình bậc hai ax² + bx + c = 0 (a ≠ 0)',
        color: 'emerald',
        children: [
          {
            id: 'b1',
            title: '1. Điều kiện có nghiệm (Bắt buộc)',
            color: 'blue',
            icon: 'alert',
            description: 'Muốn áp dụng Vi-ét, phương trình trước hết phải có nghiệm.',
            children: [
              {
                id: 'b1-1',
                title: 'Tính biệt thức Delta (Δ)',
                description: 'Δ = b² - 4ac hoặc Δ\' = (b\')² - ac với b = 2b\'.',
                keyPoint: 'Có 2 nghiệm phân biệt: Δ > 0; Có nghiệm (kể cả nghiệm kép): Δ ≥ 0.',
                trapToAvoid: 'Bẫy thi vào 10: Quên xét hệ số a ≠ 0 khi đề bài cho a chứa tham số m!',
              },
              {
                id: 'b1-2',
                title: 'Xét dấu nghiệm',
                description: 'Hai nghiệm cùng dấu (P > 0), trái dấu (ac < 0), cùng dương, cùng âm.',
                keyPoint: 'Trái dấu chỉ cần a.c < 0 (không cần tính Δ vì Δ luôn dương).',
                trapToAvoid: 'Bẫy hay gặp: Khi xét 2 nghiệm cùng dương quên điều kiện Δ ≥ 0.',
              },
            ],
          },
          {
            id: 'b2',
            title: '2. Công thức Vi-ét cốt lõi',
            color: 'emerald',
            icon: 'star',
            description: 'Mối liên hệ mật thiết giữa các nghiệm và hệ số phương trình.',
            children: [
              {
                id: 'b2-1',
                title: 'Tổng và Tích hai nghiệm',
                description: 'S = x₁ + x₂ = -b/a; P = x₁.x₂ = c/a.',
                keyPoint: 'Nhớ câu thần chú: Tổng là -b trên a, Tích là c trên a.',
                trapToAvoid: 'Bẫy dấu trừ ở Tổng: Rất nhiều bạn quên đổi dấu hệ số b thành -b.',
              },
              {
                id: 'b2-2',
                title: 'Tìm 2 số khi biết Tổng & Tích',
                description: 'Nếu u + v = S và u.v = P thì u, v là nghiệm phương trình: X² - SX + P = 0.',
                keyPoint: 'Điều kiện để tồn tại 2 số: S² - 4P ≥ 0.',
                trapToAvoid: 'Bẫy thiếu kiểm tra điều kiện S² - 4P ≥ 0 dẫn đến kết luận sai.',
              },
            ],
          },
          {
            id: 'b3',
            title: '3. Các dạng biểu thức đối xứng',
            color: 'purple',
            icon: 'zap',
            description: 'Biến đổi mọi biểu thức x₁, x₂ về dạng chỉ chứa S và P.',
            children: [
              {
                id: 'b3-1',
                title: 'Biến đổi x₁² + x₂²',
                description: 'x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂ = S² - 2P.',
                keyPoint: 'Công thức cơ bản nhất cần ghi nhớ nằm lòng.',
                trapToAvoid: 'Nhầm lẫn với (x₁ - x₂)².',
              },
              {
                id: 'b3-2',
                title: 'Biến đổi x₁³ + x₂³ & |x₁ - x₂|',
                description: 'x₁³ + x₂³ = S(S² - 3P); |x₁ - x₂| = √(S² - 4P).',
                keyPoint: 'Với hiệu tuyệt đối, bình phương hai vế rồi khai căn.',
                trapToAvoid: 'Quên đặt dấu giá trị tuyệt đối khi căn bậc hai của bình phương.',
              },
            ],
          },
          {
            id: 'b4',
            title: '4. Tìm m thỏa mãn hệ thức không đối xứng',
            color: 'amber',
            icon: 'target',
            description: 'Dạng bài phân loại điểm 9 - 10 trong đề thi tuyển sinh.',
            children: [
              {
                id: 'b4-1',
                title: 'Phương pháp giải hệ phương trình',
                description: 'Kết hợp hệ thức đề cho (vd: 2x₁ + 3x₂ = 5) với tổng x₁ + x₂ = S để giải tìm x₁, x₂ theo m.',
                keyPoint: 'Giải ra x₁, x₂ rồi thay vào phương trình tích P = x₁.x₂ để tìm m.',
                trapToAvoid: 'Tìm xong m BẮT BUỘC phải đối chiếu lại với điều kiện Δ ≥ 0 ban đầu!',
              },
              {
                id: 'b4-2',
                title: 'Hạ bậc nghiệm dựa vào phương trình gốc',
                description: 'Thay x₁ vào PT ban đầu: ax₁² = -bx₁ - c để hạ bậc các biểu thức mũ cao.',
                keyPoint: 'Bí kíp giải cực nhanh các bài toán chứa x₁² - 2mx₁...',
                trapToAvoid: 'Bẫy tính toán nhầm dấu khi chuyển vế.',
              },
            ],
          },
        ],
      },
      keyTakeaways: [
        'Bước 1 luôn luôn là: Tìm điều kiện để PT có nghiệm (a ≠ 0 và Δ ≥ 0).',
        'Bước 2: Viết hệ thức Vi-ét S = -b/a và P = c/a rõ ràng.',
        'Bước 3: Biến đổi biểu thức bài toán về S và P hoặc giải hệ.',
        'Bước 4: Luôn đối chiếu giá trị m vừa tìm được với điều kiện ở Bước 1.',
      ],
      examScore10Tips: [
        'Giám khảo trừ 0.25 - 0.5 điểm nếu không đối chiếu điều kiện a ≠ 0 và Δ ≥ 0.',
        'Dạng bài thực tế (chuyển động, năng suất) khi đưa về PT bậc hai phải đặt điều kiện chặt chẽ cho ẩn (x > 0, x thuộc N...).',
      ],
    },
    {
      id: 'van-9-truyen-kieu',
      topic: 'Truyện Kiều & Nghệ thuật miêu tả nội tâm (Ngữ văn 9)',
      grade: 'Lớp 9',
      subject: 'Ngữ Văn',
      centralTheme: 'NGHỆ THUẬT TRUYỆN KIỀU (NGỮ VĂN 9)',
      summary: 'Trọng tâm ôn thi vào 10 với các đoạn trích "Chị em Thúy Kiều", "Cảnh ngày xuân", "Kiều ở lầu Ngưng Bích".',
      root: {
        id: 'root',
        title: 'Truyện Kiều (Đại thi hào Nguyễn Du) - Kiến thức trọng tâm thi vào 10',
        color: 'rose',
        children: [
          {
            id: 'v1',
            title: '1. Giá trị hiện thực & Nhân đạo',
            color: 'rose',
            icon: 'book',
            description: 'Bản cáo trạng xã hội phong kiến bất công và tiếng nói bênh vực con người.',
            children: [
              {
                id: 'v1-1',
                title: 'Giá trị hiện thực sâu sắc',
                description: 'Phơi bày bộ mặt tàn bạo của quan lại phong kiến và sức mạnh hủy diệt của đồng tiền.',
                keyPoint: 'Đồng tiền làm tha hóa nhân cách và đẩy người lương thiện vào bước đường cùng.',
                trapToAvoid: 'Bẫy phân tích: Đừng chỉ kể lể cốt truyện, phải làm nổi bật mâu thuẫn giai cấp.',
              },
              {
                id: 'v1-2',
                title: 'Giá trị nhân đạo cao cả',
                description: 'Ngợi ca nhan sắc, tài hoa, phẩm hạnh; đồng cảm với nỗi đau của người phụ nữ.',
                keyPoint: 'Khát vọng tự do công lý và tình yêu tự do trong sáng qua nhân vật Thúy Kiều, Từ Hải.',
                trapToAvoid: 'Bẫy thiếu liên hệ tư tưởng nhân đạo của Nguyễn Du với thời đại.',
              },
            ],
          },
          {
            id: 'v2',
            title: '2. Đoạn trích: Kiều ở lầu Ngưng Bích',
            color: 'purple',
            icon: 'star',
            description: 'Đỉnh cao của bút pháp tả cảnh ngụ tình trong văn học trung đại.',
            children: [
              {
                id: 'v2-1',
                title: 'Cảnh ngộ cô đơn rợn ngợp',
                description: 'Khóa xuân tại lầu Ngưng Bích giữa non xa, trăng gần, cát vàng cồn nọ.',
                keyPoint: 'Không gian rợn ngợp đối lập với thân phận nhỏ bé, cô độc của nàng Kiều.',
                trapToAvoid: 'Nhầm lẫn giữa không gian thực và tâm trạng phản chiếu.',
              },
              {
                id: 'v2-2',
                title: 'Nỗi nhớ thương: Nhớ Kim Trọng trước, nhớ Cha Mẹ sau',
                description: 'Nguyễn Du miêu tả tâm lý cực kỳ tinh tế và hợp lý với hoàn cảnh nàng Kiều.',
                keyPoint: 'Nhớ Kim Trọng vì cảm giác mang tội phụ tình; Nhớ cha mẹ bằng chữ "xót" đau đớn.',
                trapToAvoid: 'Bẫy trừ điểm: Phải giải thích vì sao Kiều nhớ người yêu trước (do mặc cảm phụ lời thề).',
              },
              {
                id: 'v2-3',
                title: 'Bút pháp Tả cảnh ngụ tình (Điệp từ "Buồn trông")',
                description: '4 cặp câu lục bát điệp từ "Buồn trông" vẽ nên 4 bức tranh tâm trạng.',
                keyPoint: 'Cửa bể thuyền ai -> Ngọn nước hoa trôi -> Nội cỏ rầu rầu -> Gió cuốn mặt duềnh.',
                trapToAvoid: 'Bỏ quên phân tích từ láy và các hình ảnh ẩn dụ biểu tượng.',
              },
            ],
          },
          {
            id: 'v3',
            title: '3. Nghệ thuật ước lệ tượng trưng',
            color: 'teal',
            icon: 'zap',
            description: 'Quy phạm nghệ thuật trung đại qua ngòi bút bậc thầy của Nguyễn Du.',
            children: [
              {
                id: 'v3-1',
                title: 'Miêu tả Vân và Kiều ("Chị em Thúy Kiều")',
                description: 'Vân: Đoan trang, trăng tròn, mây thua nước tóc. Kiều: Làn thu thủy, nét xuân sơn, hoa ghen liễu hờn.',
                keyPoint: 'Dự báo số phận: Vân êm đềm bình yên; Kiều phong trần trắc trở số kiếp đoạn trường.',
                trapToAvoid: 'Quên từ khóa "Hoa ghen - Liễu hờn" thể hiện sự đố kỵ của tạo hóa với Kiều.',
              },
            ],
          },
        ],
      },
      keyTakeaways: [
        'Nắm vững bút pháp Tả cảnh ngụ tình và nghệ thuật ước lệ tượng trưng.',
        'Học thuộc các dẫn chứng then chốt trong "Kiều ở lầu Ngưng Bích".',
        'Cấu trúc đoạn văn phân tích: Dẫn dắt -> Trích thơ -> Phân tích từ ngữ/nghệ thuật -> Khái quát tâm trạng.',
      ],
      examScore10Tips: [
        'Muốn đạt 9.5+ môn Văn, phải liên hệ so sánh tâm trạng Kiều với ca dao dân ca hoặc thơ mới (Huy Cận, Chế Lan Viên).',
        'Mở bài gián tiếp bằng nhận định của Mộng Liên Đường hay Hoài Thanh tạo ấn tượng tuyệt đối với giám khảo.',
      ],
    },
  ],
  'Lớp 8': [
    {
      id: 'khtn-8-mol',
      topic: 'Mol & Các định luật hóa học trọng tâm (KHTN 8)',
      grade: 'Lớp 8',
      subject: 'KHTN',
      centralTheme: 'MOL & TÍNH TOÁN HÓA HỌC (KHTN 8)',
      summary: 'Khái niệm nền tảng xuyên suốt cấp 2 và cấp 3: Mol, Thể tích khí, Nồng độ phần trăm (C%) và Nồng độ mol (CM).',
      root: {
        id: 'root',
        title: 'Hệ thống công thức Mol & Định luật bảo toàn khối lượng (KHTN 8)',
        color: 'blue',
        children: [
          {
            id: 'm1',
            title: '1. Khái niệm Mol & Khối lượng Mol',
            color: 'blue',
            icon: 'star',
            description: 'Đơn vị đo lượng chất chứa 6,022.10²³ hạt vi mô.',
            children: [
              {
                id: 'm1-1',
                title: 'Công thức n = m / M',
                description: 'n (mol): số mol; m (g): khối lượng chất; M (g/mol): khối lượng mol.',
                keyPoint: 'Biến đổi tương đương: m = n.M và M = m / n.',
                trapToAvoid: 'Nhầm lẫn đơn vị m (phải đổi ra gam, không dùng kg).',
              },
            ],
          },
          {
            id: 'm2',
            title: '2. Thể tích khí ở đktc chuẩn mới (25°C, 1 bar)',
            color: 'emerald',
            icon: 'zap',
            description: 'Chương trình mới: 1 mol khí ở điều kiện chuẩn chiếm 24,79 lít (không dùng 22,4 lít cũ).',
            children: [
              {
                id: 'm2-1',
                title: 'Công thức: V = n × 24,79 (lít)',
                description: 'Suy ra n = V / 24,79.',
                keyPoint: 'LƯU Ý LỚN: Luôn dùng số 24,79 theo SGK KHTN mới!',
                trapToAvoid: 'Bẫy mất điểm: Dùng nhầm số 22,4 lít của sách giáo khoa cũ.',
              },
            ],
          },
          {
            id: 'm3',
            title: '3. Nồng độ dung dịch (C% & CM)',
            color: 'amber',
            icon: 'target',
            description: 'Tính toán chất tan trong nước và dung môi.',
            children: [
              {
                id: 'm3-1',
                title: 'Nồng độ phần trăm C% = (m_ct / m_dd) × 100%',
                description: 'm_dd = m_ct + m_dm (khối lượng dung dịch = chất tan + dung môi).',
                keyPoint: 'Khi thêm nước vào dung dịch, m_ct không đổi nhưng m_dd tăng.',
                trapToAvoid: 'Quên cộng khối lượng nước vào m_dd khi hòa tan chất.',
              },
              {
                id: 'm3-2',
                title: 'Nồng độ mol CM = n / V (mol/lít hoặc M)',
                description: 'V là thể tích dung dịch tính bằng LÍT.',
                keyPoint: 'Nếu đề cho ml, bắt buộc phải chia cho 1000 để đổi ra lít trước.',
                trapToAvoid: 'Quên đổi đơn vị ml sang lít.',
              },
            ],
          },
        ],
      },
      keyTakeaways: [
        'Bước 1: Luôn đổi các đại lượng đề bài cho ra Số mol (n).',
        'Bước 2: Viết và cân bằng phương trình hóa học chính xác.',
        'Bước 3: Dựa vào tỉ lệ mol trên phương trình để tìm số mol chất cần tính.',
      ],
      examScore10Tips: [
        'Với bài toán cho số liệu của cả 2 chất tham gia, BẮT BUỘC phải lập tỉ lệ so sánh xem chất nào dư, tính theo chất hết.',
      ],
    },
  ],
  'Lớp 7': [
    {
      id: 'toan-7-tam-giac',
      topic: 'Các trường hợp bằng nhau của Tam giác (Toán 7)',
      grade: 'Lớp 7',
      subject: 'Toán học',
      centralTheme: 'TAM GIÁC BẰNG NHAU (TOÁN 7)',
      summary: 'Nền tảng chứng minh hình học phẳng cấp 2: c-c-c, c-g-c, g-c-g và các trường hợp của tam giác vuông.',
      root: {
        id: 'root',
        title: 'Các trường hợp bằng nhau của tam giác thường & tam giác vuông',
        color: 'emerald',
        children: [
          {
            id: 't1',
            title: '1. Tam giác thường (3 trường hợp)',
            color: 'blue',
            icon: 'star',
            description: 'Các điều kiện cần và đủ để hai tam giác trùng khít lên nhau.',
            children: [
              {
                id: 't1-1',
                title: 'Cạnh - Cạnh - Cạnh (c-c-c)',
                description: 'Ba cạnh của tam giác này bằng ba cạnh của tam giác kia.',
                keyPoint: 'Chỉ cần chỉ ra 3 cặp cạnh tương ứng bằng nhau.',
                trapToAvoid: 'Viết sai thứ tự đỉnh tương ứng khi kết luận hai tam giác bằng nhau.',
              },
              {
                id: 't1-2',
                title: 'Cạnh - Góc - Cạnh (c-g-c)',
                description: 'Hai cạnh và GÓC XEN GIỮA của tam giác này bằng hai cạnh và góc xen giữa của tam giác kia.',
                keyPoint: 'Góc bắt buộc phải nằm kẹp giữa 2 cạnh.',
                trapToAvoid: 'Bẫy kinh điển: Chọn góc KHÔNG xen giữa dẫn đến chứng minh vô giá trị!',
              },
              {
                id: 't1-3',
                title: 'Góc - Cạnh - Góc (g-c-g)',
                description: 'Một cạnh và HAI GÓC KỀ của tam giác này bằng một cạnh và hai góc kề của tam giác kia.',
                keyPoint: 'Cạnh phải là cạnh kề của hai góc đó.',
                trapToAvoid: 'Nhầm lẫn vị trí cạnh kề.',
              },
            ],
          },
          {
            id: 't2',
            title: '2. Tam giác vuông (Trường hợp đặc biệt)',
            color: 'purple',
            icon: 'zap',
            description: 'Do đã có sẵn một góc vuông 90° nên chỉ cần 2 yếu tố tương ứng.',
            children: [
              {
                id: 't2-1',
                title: 'Cạnh huyền - Góc nhọn',
                description: 'Cạnh huyền và một góc nhọn bằng nhau.',
                keyPoint: 'Dùng rất phổ biến khi có phân giác hoặc đường cao.',
                trapToAvoid: 'Nhầm cạnh góc vuông với cạnh huyền.',
              },
              {
                id: 't2-2',
                title: 'Cạnh huyền - Cạnh góc vuông',
                description: 'Trường hợp mạnh nhất của tam giác vuông.',
                keyPoint: 'Chứng minh nhanh mà không cần biết số đo các góc.',
                trapToAvoid: 'Quên ghi rõ giả thiết tam giác vuông tại đâu.',
              },
            ],
          },
        ],
      },
      keyTakeaways: [
        'Vẽ hình chuẩn xác, ký hiệu rõ ràng các yếu tố bằng nhau lên hình vẽ.',
        'Ghi đúng thứ tự các đỉnh tương ứng: ΔABC = ΔA\'B\'C\'.',
        'Suy ra các cạnh tương ứng hoặc góc tương ứng để phục vụ câu hỏi tiếp theo.',
      ],
      examScore10Tips: [
        'Sau khi chứng minh tam giác bằng nhau, nhớ mở ngoặc ghi rõ căn cứ: (hai cạnh tương ứng) hoặc (hai góc tương ứng).',
      ],
    },
  ],
  'Lớp 6': [
    {
      id: 'toan-6-so-nguyen',
      topic: 'Tập hợp Số nguyên & Quy tắc dấu (Toán 6)',
      grade: 'Lớp 6',
      subject: 'Toán học',
      centralTheme: 'SỐ NGUYÊN & QUY TẮC DẤU (TOÁN 6)',
      summary: 'Bước ngoặt lớn từ số tự nhiên sang số nguyên âm, số nguyên dương và các quy tắc phá ngoặc đổi dấu.',
      root: {
        id: 'root',
        title: 'Tập hợp số nguyên Z & Các phép tính (Toán 6)',
        color: 'emerald',
        children: [
          {
            id: 'z1',
            title: '1. Khái niệm Số nguyên',
            color: 'blue',
            icon: 'star',
            description: 'Z = {..., -3, -2, -1, 0, 1, 2, 3, ...}',
            children: [
              {
                id: 'z1-1',
                title: 'Số 0 đặc biệt',
                description: 'Số 0 không phải là số nguyên dương, cũng không phải là số nguyên âm.',
                keyPoint: 'Số 0 là ranh giới trên trục số.',
                trapToAvoid: 'Bẫy trắc nghiệm: Nói "số 0 là số nguyên dương" là SAI!',
              },
              {
                id: 'z1-2',
                title: 'Số đối',
                description: 'Số đối của a là -a; Số đối của 0 là 0.',
                keyPoint: 'Hai số đối nhau có tổng bằng 0: a + (-a) = 0.',
                trapToAvoid: 'Nhầm số đối với giá trị tuyệt đối.',
              },
            ],
          },
          {
            id: 'z2',
            title: '2. Quy tắc dấu trong Nhân & Chia',
            color: 'amber',
            icon: 'zap',
            description: 'Cùng dấu thành DƯƠNG (+), khác dấu thành ÂM (-).',
            children: [
              {
                id: 'z2-1',
                title: 'Cùng dấu',
                description: '(+) . (+) = (+) và (-) . (-) = (+)',
                keyPoint: 'Âm nhân Âm ra Dương!',
                trapToAvoid: 'Rất nhiều học sinh lớp 6 nhầm lẫn (-) . (-) = (-).',
              },
              {
                id: 'z2-2',
                title: 'Khác dấu',
                description: '(+) . (-) = (-) và (-) . (+) = (-)',
                keyPoint: 'Tích chứa số lẻ thừa số nguyên âm thì mang dấu âm.',
                trapToAvoid: 'Bỏ sót dấu âm khi tính toán chuỗi nhiều phép nhân.',
              },
            ],
          },
          {
            id: 'z3',
            title: '3. Quy tắc dấu ngoặc',
            color: 'rose',
            icon: 'alert',
            description: 'Quy tắc vàng của đại số THCS.',
            children: [
              {
                id: 'z3-1',
                title: 'Đằng trước ngoặc có dấu CỘNG (+)',
                description: 'Giữ nguyên dấu của các số hạng bên trong ngoặc.',
                keyPoint: '+(a - b + c) = a - b + c',
                trapToAvoid: 'Tự ý đổi dấu khi trước ngoặc là dấu cộng.',
              },
              {
                id: 'z3-2',
                title: 'Đằng trước ngoặc có dấu TRỪ (-)',
                description: 'BẮT BUỘC ĐỔI DẤU tất cả các số hạng trong ngoặc.',
                keyPoint: '-(a - b + c) = -a + b - c',
                trapToAvoid: 'Bẫy kinh điển: Chỉ đổi dấu số hạng đầu tiên mà quên đổi dấu các số hạng phía sau!',
              },
            ],
          },
        ],
      },
      keyTakeaways: [
        'Âm nhân âm ra dương, âm nhân dương ra âm.',
        'Bỏ ngoặc có dấu trừ đằng trước phải đổi toàn bộ dấu bên trong.',
        'Ưu tiên tính toán trong ngoặc hoặc ghép các số hạng đối nhau bằng 0.',
      ],
      examScore10Tips: [
        'Khi giải bài toán tìm x: Nhớ cẩn thận chuyển vế phải ĐỔI DẤU. Chuyển vế không đổi dấu là mất điểm 10 ngay lập tức!',
      ],
    },
  ],
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
  emerald: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  blue: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    lightBg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  purple: {
    bg: 'bg-purple-600',
    border: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    lightBg: 'bg-purple-50 dark:bg-purple-950/40',
  },
  amber: {
    bg: 'bg-amber-600',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    lightBg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  rose: {
    bg: 'bg-rose-600',
    border: 'border-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    lightBg: 'bg-rose-50 dark:bg-rose-950/40',
  },
  teal: {
    bg: 'bg-teal-600',
    border: 'border-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
    lightBg: 'bg-teal-50 dark:bg-teal-950/40',
  },
  indigo: {
    bg: 'bg-indigo-600',
    border: 'border-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/40',
  },
};

export const MindMapStudio: React.FC<MindMapStudioProps> = ({
  currentGrade,
  onSendToChat,
  isDark,
}) => {
  // Current active mind map data
  const [mindMap, setMindMap] = useState<MindMapData>(() => {
    const list = DEFAULT_PRESETS[currentGrade] || DEFAULT_PRESETS['Lớp 9'];
    return list[0];
  });

  const [searchTopic, setSearchTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [loading, setLoading] = useState(false);
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});
  const [inspectedNode, setInspectedNode] = useState<MindMapNode | null>(null);
  const [copiedOutline, setCopiedOutline] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update mindmap when grade changes if not dirty
  useEffect(() => {
    const presetsForGrade = DEFAULT_PRESETS[currentGrade];
    if (presetsForGrade && presetsForGrade.length > 0) {
      setMindMap(presetsForGrade[0]);
      setCollapsedBranches({});
    }
  }, [currentGrade]);

  const toggleBranch = (id: string) => {
    setCollapsedBranches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateMindMap = async (customTopic?: string) => {
    const topicToUse = (customTopic || searchTopic).trim();
    if (!topicToUse) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: currentGrade,
          subject: selectedSubject === 'Tất cả' ? 'Toán học / Tổng hợp' : selectedSubject,
          topic: topicToUse,
        }),
      });
      const data = await res.json();
      if (data.success && data.mindmap) {
        setMindMap(data.mindmap);
        setCollapsedBranches({});
      } else {
        setErrorMsg(data.error || 'Không thể tạo sơ đồ tư duy lúc này. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ AI. Vui lòng kiểm tra mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOutline = () => {
    let outline = `# ${mindMap.centralTheme}\n> Khối lớp: ${mindMap.grade} | Môn: ${mindMap.subject}\n> Tóm tắt: ${mindMap.summary}\n\n`;
    (mindMap.root.children || []).forEach((branch, idx) => {
      outline += `## ${idx + 1}. ${branch.title}\n`;
      if (branch.description) outline += `   - Mô tả: ${branch.description}\n`;
      (branch.children || []).forEach((sub) => {
        outline += `   ### • ${sub.title}\n`;
        if (sub.description) outline += `      - Chi tiết: ${sub.description}\n`;
        if (sub.keyPoint) outline += `      - Ý cốt lõi: ${sub.keyPoint}\n`;
        if (sub.trapToAvoid) outline += `      - Bẫy đề thi: ${sub.trapToAvoid}\n`;
      });
      outline += `\n`;
    });

    outline += `## BÍ KÍP ĐIỂM 10:\n`;
    mindMap.examScore10Tips.forEach((tip) => {
      outline += `- ${tip}\n`;
    });

    navigator.clipboard.writeText(outline);
    setCopiedOutline(true);
    setTimeout(() => setCopiedOutline(false), 2000);
  };

  const handleAskAITutor = (nodeTitle: string) => {
    if (onSendToChat) {
      onSendToChat(`Hãy hướng dẫn chi tiết và chỉ ra bài tập điểm 10 về phần: "${nodeTitle}" trong sơ đồ tư duy ${mindMap.centralTheme}`);
    }
  };

  const currentPresets = DEFAULT_PRESETS[currentGrade] || [];

  return (
    <div
      className={`flex flex-col min-h-[82vh] transition-colors rounded-2xl border select-none ${
        isDark ? 'bg-[#18181b] border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Banner & AI Generator Input */}
      <div className="p-4 md:p-5 border-b border-black/10 dark:border-zinc-800 shrink-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
              <GitFork className="w-3.5 h-3.5" />
              <span>Max10 MindMap Studio · Sơ Đồ Tư Duy {currentGrade}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Hệ Thống Kiến Thức Bằng Sơ Đồ Tư Duy
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400">
              Biến toàn bộ lý thuyết và bài tập thành sơ đồ phân nhánh trực quan, dễ nhớ, vạch trần bẫy mất điểm.
            </p>
          </div>

          {/* Quick Preset Selector */}
          {currentPresets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 self-stretch lg:self-auto">
              <span className="text-xs text-slate-400 font-medium mr-1">Chủ đề có sẵn:</span>
              {currentPresets.map((p) => {
                const isActive = mindMap.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setMindMap(p);
                      setCollapsedBranches({});
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:border-emerald-500'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    {p.topic}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Generator Input Bar */}
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateMindMap()}
              placeholder={`Nhập bài học cần vẽ sơ đồ (vd: Định lý Pytago, Chiếc lược ngà, Thì hoàn thành, Men-đen...)`}
              className={`w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-xl border outline-none transition-all ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white'
              }`}
            />
          </div>

          <button
            onClick={() => handleGenerateMindMap()}
            disabled={loading || !searchTopic.trim()}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shrink-0 ${
              loading || !searchTopic.trim()
                ? 'bg-emerald-600/50 text-white/70 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
            }`}
          >
            {loading ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang phân tích & vẽ sơ đồ...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo Sơ Đồ Bằng AI</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 mt-2 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="px-4 py-2.5 bg-black/5 dark:bg-white/5 flex flex-wrap items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>{mindMap.centralTheme}</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">({mindMap.grade} · {mindMap.subject})</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[10px] hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
              title="Khôi phục 100%"
            >
              100%
            </button>
          </div>

          {/* Copy outline button */}
          <button
            onClick={handleCopyOutline}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors ${
              copiedOutline
                ? 'bg-emerald-500 text-white border-emerald-500'
                : isDark
                ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            {copiedOutline ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã chép dàn ý</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Chép dàn ý</span>
              </>
            )}
          </button>

          {/* Ask AI Tutor */}
          {onSendToChat && (
            <button
              onClick={() => handleAskAITutor(mindMap.topic)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Hỏi Gia Sư Bài Này</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Mind Map Canvas */}
      <div className="flex-1 p-4 md:p-6 overflow-auto relative">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 max-w-5xl mx-auto space-y-6"
        >
          {/* Central Root Badge */}
          <div className="flex justify-center">
            <div
              className={`p-4 md:p-5 rounded-3xl border-2 text-center max-w-2xl shadow-lg relative transition-all ${
                isDark
                  ? 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-emerald-500/50 text-white'
                  : 'bg-gradient-to-b from-emerald-50 to-white border-emerald-500 text-emerald-950'
              }`}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-wider mb-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chủ Đề Trung Tâm</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold leading-snug">
                {mindMap.root.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
                {mindMap.summary}
              </p>
            </div>
          </div>

          {/* Connecting Visual SVG Line Decor */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-slate-400/50" />
          </div>

          {/* Main Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(mindMap.root.children || []).map((branch, bIdx) => {
              const colorInfo = COLOR_MAP[branch.color || 'emerald'] || COLOR_MAP.emerald;
              const isCollapsed = collapsedBranches[branch.id];

              return (
                <div
                  key={branch.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                    isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Branch Header */}
                  <div
                    onClick={() => toggleBranch(branch.id)}
                    className={`p-3.5 cursor-pointer flex items-center justify-between gap-2 border-b transition-colors ${
                      isDark
                        ? 'border-zinc-800 hover:bg-zinc-850'
                        : 'border-slate-100 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl ${colorInfo.bg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                      >
                        {bIdx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-snug">{branch.title}</h4>
                        {branch.description && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                            {branch.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                      <span className="text-[11px] font-medium hidden sm:inline">
                        {branch.children?.length || 0} nhánh con
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Branch Sub-Nodes */}
                  {!isCollapsed && (
                    <div className="p-3.5 space-y-2.5">
                      {(branch.children || []).map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => setInspectedNode(sub)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                            isDark
                              ? 'bg-zinc-850 border-zinc-800 hover:border-emerald-500/60'
                              : 'bg-slate-50/80 border-slate-200/80 hover:border-emerald-400 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h5 className="font-semibold text-xs md:text-[13px] text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {sub.title}
                            </h5>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Xem chi tiết</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>

                          {sub.description && (
                            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-2">
                              {sub.description}
                            </p>
                          )}

                          {/* Key point pill */}
                          {sub.keyPoint && (
                            <div className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg font-medium mb-1">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{sub.keyPoint}</span>
                            </div>
                          )}

                          {/* Trap alert pill if present */}
                          {sub.trapToAvoid && (
                            <div className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                              <span>{sub.trapToAvoid}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Key Takeaways & Score 10 Golden Tips Box */}
          <div
            className={`p-5 rounded-3xl border shadow-sm transition-all ${
              isDark
                ? 'bg-gradient-to-br from-emerald-950/20 to-zinc-900 border-emerald-800/40 text-emerald-100'
                : 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 font-bold text-sm text-emerald-700 dark:text-emerald-400">
              <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              <span>BÍ KÍP ĐẠT ĐIỂM 10 TUYỆT ĐỐI CHO BÀI HỌC NÀY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              {/* Left: Key steps */}
              <div className="space-y-2">
                <h6 className="font-bold text-slate-700 dark:text-zinc-300">
                  📌 Các bước ghi nhớ cốt lõi:
                </h6>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600 dark:text-zinc-300">
                  {mindMap.keyTakeaways.map((takeaway, i) => (
                    <li key={i}>{takeaway}</li>
                  ))}
                </ul>
              </div>

              {/* Right: Secret tips */}
              <div className="space-y-2">
                <h6 className="font-bold text-slate-700 dark:text-zinc-300">
                  ⚠️ Bẫy đề thi giám khảo hay trừ điểm:
                </h6>
                <ul className="space-y-1.5 list-disc pl-4 text-amber-700 dark:text-amber-300">
                  {mindMap.examScore10Tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Detail Inspection Modal */}
      {inspectedNode && (
        <div
          onClick={() => setInspectedNode(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative transition-all ${
              isDark
                ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                : 'bg-white text-slate-900 border border-slate-200'
            }`}
          >
            <button
              onClick={() => setInspectedNode(null)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <GitFork className="w-4 h-4" />
              <span>Chi Tiết Nhánh Sơ Đồ</span>
            </div>

            <h3 className="text-lg font-bold mb-3 pr-6">{inspectedNode.title}</h3>

            {inspectedNode.description && (
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">
                {inspectedNode.description}
              </p>
            )}

            {inspectedNode.keyPoint && (
              <div className="mb-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  <Lightbulb className="w-4 h-4" />
                  <span>Ý CỐT LÕI CẦN NHỚ:</span>
                </div>
                <p className="text-slate-700 dark:text-zinc-200">{inspectedNode.keyPoint}</p>
              </div>
            )}

            {inspectedNode.trapToAvoid && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>BẪY ĐỀ THI HAY TRỪ ĐIỂM:</span>
                </div>
                <p className="text-slate-700 dark:text-zinc-200">{inspectedNode.trapToAvoid}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-black/10 dark:border-zinc-800">
              {onSendToChat && (
                <button
                  onClick={() => {
                    handleAskAITutor(inspectedNode.title);
                    setInspectedNode(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Zap className="w-4 h-4" />
                  <span>Hỏi Gia Sư Về Nhánh Này</span>
                </button>
              )}
              <button
                onClick={() => setInspectedNode(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
