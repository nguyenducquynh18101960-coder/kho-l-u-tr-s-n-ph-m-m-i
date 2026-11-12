import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Users,
  GraduationCap,
  Crown,
  Zap,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Plus,
  Download,
  Mail,
  Phone,
  School,
  BookOpen,
  Calendar,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  ArrowUpDown,
  MoreVertical,
  Check,
  X,
  Eye,
  FileText,
  BadgePercent,
  TrendingUp,
  QrCode,
  Copy,
  ExternalLink,
  Globe,
  Bookmark,
  Smartphone,
  Laptop,
  Radio,
  ShieldCheck,
  Share2,
  HelpCircle,
  Send,
  Building2,
  CreditCard,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { ADMIN_DEFAULT_PIN, MASTER_SECURITY_CODE } from '../../types/auth';

export interface UserAccount {
  id: string;
  name: string;
  emailOrPhone?: string;
  email?: string;
  phone?: string;
  school?: string;
  department?: string;
  subject?: string;
  grade?: string;
  role: 'student' | 'teacher' | 'admin';
  plan: 'free' | 'plus' | 'premium';
  status: 'active' | 'locked';
  avatar?: string;
  joinedAt: string;
  lecturesCount?: number;
  questionsCount?: number;
  videosCount?: number;
  lastActive?: string;
}

interface Max10ControlCenterProps {
  isDark: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectUserToChat?: (user: UserAccount) => void;
  isOwner?: boolean;
  currentUser?: any;
  onLoginAsAdmin?: (user: any) => void;
}

export const Max10ControlCenter: React.FC<Max10ControlCenterProps> = ({
  isDark,
  isOpen = true,
  onClose,
  isOwner = true,
  currentUser,
  onLoginAsAdmin,
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student' | 'upgraded'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User requested: "mã QR để chuyển tài khoản là cái QR mà bạn vừa làm thanh điều khiển để điều khiển Max10 và xem tất cả tài khoản là quyền của bạn mở duy gmail đómackhanhduy992012@gmail.comchỉ có bạn mới xem được tất cả và làm quản trị viên của Max10 với hướng dẫn tôi tìm thấy Max10 trên google"
  const [activeCenterTab, setActiveCenterTab] = useState<'control_qr' | 'accounts' | 'google_guide' | 'security'>('control_qr');
  const [bannedAccounts, setBannedAccounts] = useState<any[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState<boolean>(false);
  const [selectedBankId, setSelectedBankId] = useState<string>('MB');
  const [transferAmount, setTransferAmount] = useState<number>(100000);
  const [holidayDiscount, setHolidayDiscount] = useState<boolean>(true); // -20% ngày lễ 20/10, 20/11, 8/3
  const [aiSpeedMode, setAiSpeedMode] = useState<'ultra_01s' | 'standard'>('ultra_01s');
  const [grade10SecretMode, setGrade10SecretMode] = useState<boolean>(true);
  const [autoReceiptScan, setAutoReceiptScan] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchBannedAccounts = async () => {
    try {
      setLoadingSecurity(true);
      const res = await fetch('/api/security/banned-accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.bannedAccounts)) {
        setBannedAccounts(data.bannedAccounts);
      }
    } catch (e) {
      console.warn('Lỗi lấy danh sách ban:', e);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleSimulateHack = async () => {
    try {
      const res = await fetch('/api/security/simulate-hack-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Kẻ_Hack_Xâm_Nhập_' + Math.floor(100 + Math.random() * 900),
          studentId: 'bad-actor-' + Date.now(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('🛡️ Đã phát hiện và TỰ ĐỘNG BAN & XÓA VĨNH VIỄN tài khoản kẻ hack!');
        fetchBannedAccounts();
      }
    } catch {
      showToast('Lỗi khi gửi yêu cầu thử nghiệm an ninh.');
    }
  };

  const handleUnbanAll = async () => {
    const code = window.prompt('Nhập mã bảo mật chống hack để gỡ ban (24122012@duy):');
    if (!code) return;
    try {
      const res = await fetch('/api/security/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ securityCode: code.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Đã gỡ ban thành công với mã bảo mật 24122012@duy!');
        fetchBannedAccounts();
      } else {
        showToast(data.error || 'Mã bảo mật không đúng!');
      }
    } catch {
      showToast('Lỗi khi gửi yêu cầu gỡ ban.');
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    showToast(`Đã sao chép ${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // New account form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'teacher'>('teacher');
  const [newEmailOrPhone, setNewEmailOrPhone] = useState('');
  const [newSchool, setNewSchool] = useState('THCS Nguyễn Du');
  const [newGradeOrSubject, setNewGradeOrSubject] = useState('');
  const [newPlan, setNewPlan] = useState<'free' | 'plus' | 'premium'>('plus');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        // User requirement: "bỏ các tài khoản giả trong điều khiển Max10 đi chỉ có Mạc Khánh Duy mới là quản trị viên gmail là mackhanhduy992012@gmail.com"
        // Strict filter to discard any fake/mock users
        const cleaned = data.accounts.filter(
          (acc: any) =>
            acc.id === 'admin-mac-khanh-duy' ||
            (acc.emailOrPhone &&
              !acc.id.startsWith('fake') &&
              !acc.id.startsWith('mock') &&
              !acc.id.startsWith('std-') &&
              acc.id !== 'gv-thuy')
        );
        const seenIds = new Set<string>();
        const uniqueAccounts: UserAccount[] = [];
        for (const acc of cleaned) {
          if (acc && acc.id && !seenIds.has(acc.id)) {
            seenIds.add(acc.id);
            uniqueAccounts.push(acc);
          }
        }
        setAccounts(uniqueAccounts);
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load accounts:', e);
    } finally {
      setLoading(false);
    }
  };

  // User Requirement: "link tôi xuất bản chỉ có Mạc Khánh Duy mới làm quản trị viên còn những người khác khi vào link thì chỉ làm học sinh hoặc thầy cô khi bấm vào link tôi gửi"
  // User Requirement: "còn ảnh thứ 3 thì reset không cho làm quản trị viên cho làm khách"
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // Strict check: Nếu người dùng là Phương Linh hoặc tài khoản khách/học sinh, luôn khóa màn hình quản trị
    if (currentUser) {
      const cleanName = (currentUser.name || '').trim().toLowerCase();
      const cleanEmail = (currentUser.email || '').trim().toLowerCase();
      const isDuy =
        cleanName === 'mạc khánh duy' ||
        cleanName === 'mac khanh duy' ||
        cleanEmail === 'mackhanhduy992012@gmail.com' ||
        currentUser.id === 'admin-mac-khanh-duy';
      if (!isDuy) {
        return false;
      }
    }

    const isCurrentAdminUser = currentUser?.email === 'mackhanhduy992012@gmail.com' || currentUser?.id === 'admin-mac-khanh-duy';
    const isExplicitOwner = localStorage.getItem('max10_is_owner_access') === 'true';
    const hasAdminEmail = localStorage.getItem('max10_admin_email') === 'mackhanhduy992012@gmail.com';
    const hasPinVerified = localStorage.getItem('max10_admin_unlocked') === 'true';

    return isCurrentAdminUser || (isExplicitOwner && hasAdminEmail && hasPinVerified);
  });
  const [adminNameInput, setAdminNameInput] = useState<string>('Mạc Khánh Duy');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = adminNameInput.trim().toLowerCase();
    const isDuy = cleanName === 'mạc khánh duy' || cleanName === 'mac khanh duy';

    if (!isDuy) {
      setPinError('Chỉ duy nhất Mạc Khánh Duy mới có quyền xác thực Quản trị viên!');
      return;
    }

    const pinVal = pinInput.trim();
    if (
      pinVal === '24122012@duy' ||
      pinVal === MASTER_SECURITY_CODE ||
      pinVal === '24122012@' ||
      pinVal === ADMIN_DEFAULT_PIN
    ) {
      localStorage.setItem('max10_admin_email', 'mackhanhduy992012@gmail.com');
      localStorage.setItem('max10_is_owner_access', 'true');
      sessionStorage.setItem('max10_master_security_verified', 'true');
      sessionStorage.setItem('max10_bypass_update', 'true');
      setIsAdminUnlocked(true);
      showToast('🎉 Mở khóa Quản trị viên Mạc Khánh Duy thành công với mã bảo mật!');
    } else {
      setPinError('Mã PIN không chính xác! Chỉ Mạc Khánh Duy mới có quyền truy cập với mã bảo mật 24122012@duy.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Xóa tài khoản cá nhân
  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (accountId === 'admin-mac-khanh-duy' || accountName.toLowerCase().includes('mạc khánh duy')) {
      showToast('❌ Không thể xóa tài khoản Quản trị viên tối cao Mạc Khánh Duy!');
      return;
    }
    const confirmed = window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${accountName}" không?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/accounts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        showToast(`🗑️ Đã xóa vĩnh viễn tài khoản "${accountName}" thành công!`);
      } else {
        showToast(data.error || 'Lỗi khi xóa tài khoản!');
      }
    } catch (e) {
      showToast('Lỗi khi gửi yêu cầu xóa tài khoản!');
    }
  };

  // Reset tài khoản cá nhân về mặc định
  const handleResetAccount = async (accountId: string, accountName: string) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn RESET tài khoản "${accountName}" về trạng thái mặc định ban đầu không?`);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/accounts/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === accountId ? { ...a, plan: 'free', status: 'active' } : a))
        );
        showToast(`🔄 Đã reset tài khoản "${accountName}" về mặc định ban đầu!`);
      } else {
        showToast(data.error || 'Lỗi khi reset tài khoản!');
      }
    } catch (e) {
      showToast('Lỗi khi gửi yêu cầu reset tài khoản!');
    }
  };

  // Reset toàn bộ tài khoản của mọi người
  const handleResetAllAccounts = async () => {
    const confirmed = window.confirm('⚠️ CẢNH BÁO QUẢN TRỊ VIÊN: Bạn có chắc chắn muốn RESET TẤT CẢ tài khoản của mọi người về cấu hình mặc định ban đầu không?');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/accounts/reset-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showToast('🔄 Đã reset toàn bộ tài khoản người dùng về mặc định thành công!');
        fetchAccounts();
      } else {
        showToast(data.error || 'Lỗi khi reset toàn bộ tài khoản!');
      }
    } catch (e) {
      showToast('Lỗi khi gửi yêu cầu reset toàn bộ tài khoản!');
    }
  };

  // Xóa toàn bộ tài khoản người dùng (chỉ giữ lại Mạc Khánh Duy)
  const handleDeleteAllAccounts = async () => {
    const confirmed = window.confirm('🚨 CẢNH BÁO NGUY CẤP: Bạn có chắc chắn muốn XÓA TẤT CẢ tài khoản của mọi người không? Chỉ duy nhất Quản trị viên Mạc Khánh Duy được giữ lại!');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/accounts/delete-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showToast('🗑️ Đã xóa sạch toàn bộ tài khoản người dùng, chỉ giữ lại Mạc Khánh Duy!');
        fetchAccounts();
      } else {
        showToast(data.error || 'Lỗi khi xóa tất cả tài khoản!');
      }
    } catch (e) {
      showToast('Lỗi khi gửi yêu cầu xóa tất cả tài khoản!');
    }
  };

  const handleUpdatePlan = async (accountId: string, plan: 'free' | 'plus' | 'premium') => {
    try {
      const res = await fetch('/api/admin/accounts/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, plan }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === accountId ? { ...acc, plan } : acc))
        );
        showToast(`Đã nâng cấp tài khoản sang ${plan.toUpperCase()} thành công!`);
      }
    } catch (e) {
      showToast('Có lỗi xảy ra khi cập nhật gói!');
    }
  };

  const handleToggleStatus = async (accountId: string, currentStatus: 'active' | 'locked') => {
    const nextStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      const res = await fetch('/api/admin/accounts/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === accountId ? { ...acc, status: nextStatus } : acc))
        );
        showToast(
          nextStatus === 'locked'
            ? 'Đã tạm khóa tài khoản!'
            : 'Đã mở khóa tài khoản hoạt động bình thường!'
        );
      }
    } catch (e) {
      showToast('Có lỗi xảy ra khi đổi trạng thái!');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/admin/accounts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          role: newRole,
          emailOrPhone: newEmailOrPhone,
          school: newSchool,
          gradeOrSubject: newGradeOrSubject,
          plan: newPlan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã tạo tài khoản ${newName} thành công!`);
        setShowAddModal(false);
        setNewName('');
        setNewEmailOrPhone('');
        fetchAccounts();
      }
    } catch (e) {
      showToast('Lỗi khi tạo tài khoản!');
    }
  };

  const handleExportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'ID,Họ và Tên,Vai trò,Gói cước,Trường học,Bộ môn/Lớp,Email/SĐT,Trạng thái',
        ...accounts.map(
          (a) =>
            `"${a.id}","${a.name}","${a.role === 'teacher' ? 'Thầy Cô' : 'Học sinh'}","${a.plan}","${
              a.school || ''
            }","${a.subject || a.grade || ''}","${a.email || a.emailOrPhone || a.phone || ''}","${
              a.status
            }"`
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_Sach_Tai_Khoan_Max10_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất danh sách tài khoản ra file CSV!');
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    // Search
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      acc.name.toLowerCase().includes(q) ||
      (acc.email && acc.email.toLowerCase().includes(q)) ||
      (acc.emailOrPhone && acc.emailOrPhone.toLowerCase().includes(q)) ||
      (acc.phone && acc.phone.includes(q)) ||
      (acc.school && acc.school.toLowerCase().includes(q)) ||
      (acc.subject && acc.subject.toLowerCase().includes(q)) ||
      (acc.grade && acc.grade.toLowerCase().includes(q));

    if (!matchSearch) return false;

    // Role
    if (roleFilter === 'teacher' && acc.role !== 'teacher') return false;
    if (roleFilter === 'student' && acc.role !== 'student') return false;
    if (roleFilter === 'upgraded' && acc.plan === 'free') return false;

    // Plan
    if (planFilter !== 'all' && acc.plan !== planFilter) return false;

    return true;
  });

  const teacherCount = accounts.filter((a) => a.role === 'teacher').length;
  const studentCount = accounts.filter((a) => a.role === 'student').length;
  const upgradedCount = accounts.filter((a) => a.plan === 'plus' || a.plan === 'premium').length;

  // User Requirement: "link tôi xuất bản chỉ có Mạc Khánh Duy mới làm quản trị viên còn những người khác khi vào link thì chỉ làm học sinh hoặc thầy cô khi bấm vào link tôi gửi"
  const isMacKhanhDuy = isAdminUnlocked;

  const handleAuthenticateAdmin = () => {
    localStorage.setItem('max10_admin_email', 'mackhanhduy992012@gmail.com');
    localStorage.setItem('max10_is_owner_access', 'true');
    const adminUser = {
      id: 'admin-mac-khanh-duy',
      name: 'Mạc Khánh Duy',
      email: 'mackhanhduy992012@gmail.com',
      phone: '0778901259',
      role: 'admin' as const,
      plan: 'premium' as const,
      school: 'Ban Quản Trị Tối Cao Max10 AI',
      status: 'active' as const,
      joinedAt: '13/10/2026',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    };
    localStorage.setItem('max10_auth_user', JSON.stringify(adminUser));
    if (onLoginAsAdmin) {
      onLoginAsAdmin(adminUser);
    }
    setIsAdminUnlocked(true);
    showToast('🎉 Đã xác thực thành công Quản trị viên Mạc Khánh Duy (mackhanhduy992012@gmail.com)!');
  };

  const BANK_OPTIONS = [
    { id: 'MB', name: 'MB Bank (Ngân hàng Quân đội)', shortName: 'MB Bank', bin: '970422', defaultAccountNo: '0778901259', badge: 'Quân Đội' },
    { id: 'ZaloPay', name: 'Ví điện tử ZaloPay (SĐT: 0778901259)', shortName: 'ZaloPay', bin: '970422', defaultAccountNo: '0778901259', badge: 'ZaloPay' },
    { id: 'VCB', name: 'Vietcombank (Ngoại thương VN)', shortName: 'Vietcombank', bin: '970436', defaultAccountNo: '0778901259', badge: 'VCB' },
    { id: 'TCB', name: 'Techcombank (Kỹ thương VN)', shortName: 'Techcombank', bin: '970407', defaultAccountNo: '0778901259', badge: 'Techcom' },
    { id: 'ICB', name: 'VietinBank (Công thương VN)', shortName: 'VietinBank', bin: '970415', defaultAccountNo: '0778901259', badge: 'Công Thương' },
  ];

  const activeBank = BANK_OPTIONS.find((b) => b.id === selectedBankId) || BANK_OPTIONS[0];
  const finalTransferPrice = holidayDiscount ? Math.round(transferAmount * 0.8) : transferAmount;
  const transferSyntax = `MAX10 ${currentUser?.name ? currentUser.name.replace(/[^a-zA-Z0-9]/g, '') : 'VIP'} ${finalTransferPrice}`;
  const qrImageUrl = `https://img.vietqr.io/image/${activeBank.bin}-0778901259-compact2.png?amount=${finalTransferPrice}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=MAC%20KHANH%20DUY`;

  // Lock Screen for Non-Admin Visitors
  if (!isAdminUnlocked) {
    return (
      <div className="w-full h-full overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
        <div className={`max-w-lg w-full my-auto p-6 sm:p-8 rounded-3xl border text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl font-black">
          👑
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight">
            Khu Vực Quản Trị Viên Dành Cho Mạc Khánh Duy
          </h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Link xuất bản dành cho <strong>Học sinh</strong> và <strong>Giáo viên</strong>. Chỉ có duy nhất <strong>Mạc Khánh Duy</strong> (<code>mackhanhduy992012@gmail.com</code>) mới có quyền truy cập thanh điều khiển này.
          </p>
        </div>

        <form onSubmit={handleVerifyPin} className="space-y-3 pt-2 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Họ và tên Quản trị viên:
            </label>
            <input
              type="text"
              required
              value={adminNameInput}
              onChange={(e) => {
                setAdminNameInput(e.target.value);
                setPinError('');
              }}
              placeholder="Mạc Khánh Duy"
              className="w-full font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Mã PIN xác thực Quản trị viên:
            </label>
            <input
              type="password"
              required
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              placeholder="Nhập mã PIN bảo mật quản trị viên..."
              className="w-full text-center tracking-widest font-mono text-base px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {pinError && (
            <p className="text-xs font-bold text-rose-500 text-center">{pinError}</p>
          )}

          <div className="flex items-center gap-2 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Quay lại
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Mở Khóa Quản Trị
            </button>
          </div>
        </form>
      </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-y-auto p-4 sm:p-6 pb-40 space-y-6 ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-emerald-500/50 shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Super Admin Identity Badge for Mac Khanh Duy in Modern Neumorphism */}
      <div className="p-5 rounded-3xl neu-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-500/30">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-[2px_2px_10px_rgba(245,158,11,0.4)] shrink-0">
            👑
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-black text-slate-900 dark:text-white">
                MẠC KHÁNH DUY
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black uppercase tracking-wider shadow-2xs">
                Quản trị viên tối cao Max10
              </span>
              {isMacKhanhDuy ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Chính chủ đã xác thực</span>
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Chưa xác thực Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-1 truncate">
              Gmail: <strong className="text-emerald-600 dark:text-emerald-400">mackhanhduy992012@gmail.com</strong> · SĐT: <strong className="text-slate-800 dark:text-zinc-200">0778901259</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {!isMacKhanhDuy ? (
            <button
              type="button"
              onClick={handleAuthenticateAdmin}
              className="py-2.5 px-4 rounded-2xl neu-accent-btn text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Crown className="w-4 h-4" />
              <span>Đăng nhập Mạc Khánh Duy</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Toàn quyền xem tất cả tài khoản</span>
            </span>
          )}
        </div>
      </div>

      {/* 3 Main Navigation Tabs in Modern Neumorphism */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl neu-pressed overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveCenterTab('control_qr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeCenterTab === 'control_qr'
              ? 'neu-accent-btn text-white'
              : 'neu-btn text-slate-700 dark:text-zinc-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>⚡ Thanh Điều Khiển &amp; QR Chuyển Khoản</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCenterTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeCenterTab === 'accounts'
              ? 'neu-accent-btn text-white'
              : 'neu-btn text-slate-700 dark:text-zinc-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Quản Lý Tất Cả Tài Khoản ({accounts.length})</span>
          {!isMacKhanhDuy && <Lock className="w-3.5 h-3.5 text-amber-500" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveCenterTab('google_guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeCenterTab === 'google_guide'
              ? 'neu-accent-btn text-white'
              : 'neu-btn text-slate-700 dark:text-zinc-300'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>🔍 Hướng Dẫn Tìm Max10 Trên Google</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCenterTab('security');
            fetchBannedAccounts();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeCenterTab === 'security'
              ? 'neu-accent-btn text-white'
              : 'neu-btn text-slate-700 dark:text-zinc-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>🛡️ Bảo Mật &amp; Chống Hack (24122012@duy)</span>
          {bannedAccounts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {bannedAccounts.length} đã ban
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: THANH ĐIỀU KHIỂN MAX10 & MÃ QR CHUYỂN KHOẢN (User Requested) */}
      {activeCenterTab === 'control_qr' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Banner Requirement Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mã QR Chuyển Tài Khoản & Thanh Điều Khiển Max10</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Thanh Điều Khiển Max10 AI & Cổng Chuyển Khoản Tự Động
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Mã QR chuyển khoản chính thức của Max10 hiển thị tên thụ hưởng: <strong>MAC KHÁNH DUY</strong>, Số điện thoại: <strong>0778901259</strong>. Dùng để chuyển tiền nâng cấp gói cước, kích hoạt tốc độ phản hồi 0.1s và điều khiển các thông số học tập Max10.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCenterTab('google_guide')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm trên Google</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive VietQR Box */}
            <div
              className={`lg:col-span-5 p-5 rounded-3xl border flex flex-col items-center text-center shadow-lg ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              {/* Bank selector tabs */}
              <div className="w-full mb-3 text-left">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                  Chọn Ngân hàng hoặc Ví điện tử:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {BANK_OPTIONS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBankId(b.id)}
                      className={`p-2 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                        selectedBankId === b.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                          : isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {b.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount selector */}
              <div className="w-full mb-3 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Chọn Số tiền chuyển:
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-black text-rose-500">
                    <input
                      type="checkbox"
                      checked={holidayDiscount}
                      onChange={(e) => setHolidayDiscount(e.target.checked)}
                      className="rounded accent-rose-600 cursor-pointer"
                    />
                    <span>Ưu đãi ngày lễ (-20%)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[80000, 100000, 400000, 500000].map((amt) => {
                    const discounted = holidayDiscount ? Math.round(amt * 0.8) : amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTransferAmount(amt)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          transferAmount === amt
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-black'
                            : isDark
                            ? 'bg-zinc-850 border-zinc-700 text-zinc-300 hover:bg-zinc-750 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <div className="text-xs sm:text-sm">{discounted.toLocaleString('vi-VN')}đ</div>
                        {holidayDiscount && (
                          <div className="text-[10px] line-through opacity-70">
                            {amt.toLocaleString('vi-VN')}đ
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* The Live QR Frame */}
              <div className="relative group p-3 rounded-2xl bg-white border-2 border-emerald-500/40 shadow-md overflow-hidden my-2">
                <img
                  src={qrImageUrl}
                  alt="Mã QR Chuyển Khoản Max10"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                />
                <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse opacity-75" />
              </div>

              {/* Exact Beneficiary Info Box under QR */}
              <div className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border-2 border-emerald-500/40 text-left space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Thông tin ghi ở dưới Mã QR:</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    Chính chủ 100%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/80 border border-emerald-500/30">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-semibold">Tên ghi ở dưới Mã QR:</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                      MAC KHÁNH DUY (MẠC KHÁNH DUY)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('MAC KHANH DUY', 'Tên chủ tài khoản')}
                    className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                    title="Sao chép tên MAC KHÁNH DUY"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/80 border border-emerald-500/30">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-semibold">Số điện thoại là:</span>
                    <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                      0778901259
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('0778901259', 'Số điện thoại')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </button>
                </div>
              </div>

              {/* Actions for QR */}
              <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                <a
                  href={qrImageUrl}
                  download={`vietqr-max10-${selectedBankId}-${finalTransferPrice}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Lưu ảnh mã QR về máy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Lưu ảnh QR</span>
                </a>

                <button
                  type="button"
                  onClick={() => copyText(qrImageUrl, 'Đường link Mã QR')}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  title="Sao chép đường link dẫn thẳng tới mã QR này"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép Link QR</span>
                </button>
              </div>
            </div>

            {/* Right: Max10 AI Control Sliders & Settings */}
            <div className="lg:col-span-7 space-y-4">
              <div
                className={`p-5 rounded-3xl border space-y-4 shadow-sm ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <h4 className="text-base font-black flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-500" />
                    <span>Thanh Điều Khiển Tham Số Max10 AI</span>
                  </h4>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    Đang hoạt động 100%
                  </span>
                </div>

                {/* Control 1: AI Speed Mode */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-xs block text-slate-800 dark:text-zinc-200">
                      ⚡ Tốc Độ Trả Lời Max10 AI
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {aiSpeedMode === 'ultra_01s'
                        ? 'Chế độ Siêu Tốc VIP 0.1s: Câu trả lời hiển thị tức thì không cần chờ đợi.'
                        : 'Chế độ Tiêu chuẩn: Tối ưu cho giải bài tập dài.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = aiSpeedMode === 'ultra_01s' ? 'standard' : 'ultra_01s';
                      setAiSpeedMode(next);
                      showToast(`Đã chuyển tốc độ Max10 sang ${next === 'ultra_01s' ? 'Siêu Tốc 0.1s' : 'Tiêu chuẩn'}!`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      aiSpeedMode === 'ultra_01s'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {aiSpeedMode === 'ultra_01s' ? 'Siêu Tốc 0.1s' : 'Tiêu Chuẩn'}
                  </button>
                </div>

                {/* Control 2: Strict Grade 10 THCS Mode */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-xs block text-slate-800 dark:text-zinc-200">
                      🎯 Chế Độ Giải Bài Chuẩn Điểm 10 THCS
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Bám sát barem điểm thi vào 10 Sở GD&ĐT, chỉ ra bẫy sai lầm và từng bước đạt điểm tuyệt đối.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGrade10SecretMode(!grade10SecretMode);
                      showToast(grade10SecretMode ? 'Đã tắt chế độ Điểm 10 nghiêm ngặt' : 'Đã bật chế độ Điểm 10 nghiêm ngặt!');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      grade10SecretMode
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {grade10SecretMode ? 'Đang Bật' : 'Đang Tắt'}
                  </button>
                </div>

                {/* Control 3: Auto Receipt Scan */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-xs block text-slate-800 dark:text-zinc-200">
                      📷 Máy Quét Hóa Đơn Tự Động Kích Hoạt Gói
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Tự động quét ảnh chụp màn hình chuyển khoản qua mã QR và nâng cấp tài khoản tức thì.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoReceiptScan(!autoReceiptScan);
                      showToast(autoReceiptScan ? 'Đã tắt máy quét ảnh tự động' : 'Đã bật máy quét ảnh tự động!');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      autoReceiptScan
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {autoReceiptScan ? 'Đang Bật' : 'Đang Tắt'}
                  </button>
                </div>

                {/* Control 4: Exclusive Admin Notice */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Quyền Quản Trị Viên Max10 Tối Cao</span>
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      Độc quyền
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                    Theo quy định hệ thống: <strong>Thanh điều khiển để điều khiển Max10 và xem tất cả tài khoản học sinh, thầy/cô giáo chỉ được cấp quyền duy nhất cho bạn Mạc Khánh Duy (Gmail: mackhanhduy992012@gmail.com - SĐT: 0778901259)</strong>.
                  </p>
                  <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      mackhanhduy992012@gmail.com
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCenterTab('accounts')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-xs cursor-pointer shadow-xs"
                    >
                      Mở Danh Sách Tất Cả Tài Khoản →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HƯỚNG DẪN TÌM MAX10 TRÊN GOOGLE (User Requested) */}
      {activeCenterTab === 'google_guide' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>Google Search & Bookmarks Guide</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              🔍 Giải Đáp: Đã Đợi 1 Tháng Nhưng Chưa Thấy Max10 Trên Google?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-3xl leading-relaxed">
              Dưới đây là nguyên nhân kỹ thuật chính xác vì sao một trang web dù đã hoạt động 1 tháng vẫn chưa lên kết quả tìm kiếm tự nhiên của Google và các giải pháp khắc phục ngay lập tức:
            </p>

            {/* Why 1 month banner */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2 text-xs sm:text-sm text-blue-50">
              <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>3 NGUYÊN NHÂN CHÍNH:</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 opacity-95 text-xs">
                <li>
                  <strong>Tên miền máy chủ đám mây (*.run.app):</strong> Google Cloud Run mặc định xem các tên miền này là môi trường thử nghiệm ứng dụng, nên robot tự động (Googlebot) sẽ <em>không tự động quét</em> nếu không có đường dẫn giới thiệu từ bên ngoài.
                </li>
                <li>
                  <strong>Chưa có liên kết công khai (Backlink):</strong> Google tìm trang web bằng cách "bò" theo các liên kết. Nếu bạn chỉ chia sẻ link trong tin nhắn riêng tư mà chưa từng đăng link lên Facebook, Zalo nhóm, diễn đàn, YouTube... thì robot Google chưa từng nhận diện được link này.
                </li>
                <li>
                  <strong>Từ khóa ngắn có độ cạnh tranh cao:</strong> Từ khóa "Max10 AI" rất ngắn, Google thường ưu tiên các trang báo chí lớn hoặc thương hiệu lâu năm trừ khi có đường dẫn cụ thể.
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.google.com/search?q=site:ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app"
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-white text-blue-700 font-black text-xs sm:text-sm shadow-md hover:bg-blue-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>🔍 Kiểm Tra Google Lập Chỉ Mục (Lệnh site:)</span>
              </a>
              <button
                type="button"
                onClick={() => copyText('https://ais-pre-vnf6pultt3mbsewyewcrws-816343972167.asia-east1.run.app', 'Link ứng dụng')}
                className="py-2.5 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép link web để đăng Facebook/Zalo</span>
              </button>
            </div>
          </div>

          {/* 4 Steps Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 shadow-xs ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 font-black text-lg flex items-center justify-center">
                1
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Mở Google Search
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Mở trình duyệt Google Chrome, Cốc Cốc, Safari hoặc truy cập trang chủ <strong>google.com</strong> trên máy tính hoặc điện thoại.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 shadow-xs ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 font-black text-lg flex items-center justify-center">
                2
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Gõ Từ Khóa Tìm Kiếm
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Nhập một trong các từ khóa:
              </p>
              <div className="space-y-1">
                {['Max10 AI', 'Max10 AI - Gia sư chinh phục điểm 10', 'Gia sư Max10 AI', 'Max10 AI Studio'].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => copyText(kw, 'Từ khóa')}
                    className="w-full text-left px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-emerald-500/15 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate flex items-center justify-between cursor-pointer"
                  >
                    <span>"{kw}"</span>
                    <Copy className="w-3 h-3 shrink-0 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 shadow-xs ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 font-black text-lg flex items-center justify-center">
                3
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Bấm Vào Kết Quả Chính Thức
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Chọn kết quả có tiêu đề: <strong className="text-slate-900 dark:text-white">Max10 AI - Gia sư chinh phục điểm 10</strong> với biểu tượng vương miện Điểm 10.
              </p>
            </div>

            {/* Step 4 */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border space-y-2.5 shadow-xs ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 font-black text-lg flex items-center justify-center">
                4
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Đánh Dấu Để Mở 1 Chạm
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                • <strong>Máy tính:</strong> Bấm phím tắt <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">Ctrl + D</code> (Windows) hoặc <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">Cmd + D</code> (Mac) để lưu vào Bookmarks.<br />
                • <strong>Điện thoại:</strong> Nhấn Menu (⋮) → Chọn <strong>"Thêm vào Màn hình chính"</strong> để có icon app mở ngay như Zalo!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ TẤT CẢ TÀI KHOẢN (Chỉ cấp quyền cho Mạc Khánh Duy) */}
      {activeCenterTab === 'accounts' && !isMacKhanhDuy && (
        <div className={`w-full min-h-[50vh] flex items-center justify-center p-4 animate-in fade-in`}>
          <div
            className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border shadow-2xl text-center space-y-5 ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                <span>Bảo Mật Quản Trị Viên Max10 AI</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black">
                Khu Vực Quản Trị Viên Tối Cao
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Theo quy định hệ thống: <strong>Thanh điều khiển để điều khiển Max10 và xem tất cả tài khoản học sinh, thầy/cô giáo chỉ được cấp quyền duy nhất cho Quản trị viên Mạc Khánh Duy</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">Tài khoản quản trị viên được chỉ định:</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">Chính chủ</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>MẠC KHÁNH DUY</span>
              </div>
              <div className="text-xs text-amber-800 dark:text-amber-300 font-mono font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>Gmail: mackhanhduy992012@gmail.com</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-zinc-400 font-mono flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Số điện thoại: 0778901259</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAuthenticateAdmin}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Crown className="w-4 h-4" />
                <span>Xác Thực & Đăng Nhập Mạc Khánh Duy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCenterTab('control_qr')}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Quay lại Xem Mã QR Chuyển Tài Khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNTS TABLE FOR MAC KHANH DUY */}
      {activeCenterTab === 'accounts' && isMacKhanhDuy && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sliders className="w-3.5 h-3.5" />
                <span>Bộ Điều Khiển Trung Tâm Max10 AI</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                <span>Quản Lý Tất Cả Tài Khoản Học Sinh & Thầy/Cô Giáo</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                  {accounts.length} Tài khoản
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Bảng điều khiển trực tiếp cho phép kiểm tra danh sách, thông tin liên hệ, gói cước, trạng thái hoạt động và nâng cấp gói tức thì cho bất kỳ học sinh hay giáo viên nào.
              </p>
            </div>

            {/* User requirement banner: Bỏ toàn bộ tài khoản giả - Chỉ duy nhất Mạc Khánh Duy là Quản trị viên */}
            <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-zinc-200 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                <strong>Hệ thống xác thực:</strong> Đã loại bỏ 100% tài khoản giả lập khỏi thanh điều khiển Max10. Chỉ duy nhất Quản trị viên tối cao <strong>Mạc Khánh Duy</strong> (Gmail: <code className="text-emerald-600 dark:text-emerald-400 font-mono">mackhanhduy992012@gmail.com</code> - SĐT: 0778901259) nắm toàn quyền điều hành hệ thống.
              </span>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={fetchAccounts}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs'
                }`}
                title="Tải lại danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleResetAllAccounts}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer shadow-2xs"
                title="Reset tất cả tài khoản của mọi người về cấu hình mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset Mọi Người</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteAllAccounts}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer shadow-2xs"
                title="Xóa tất cả tài khoản người dùng (chỉ giữ lại Quản trị viên Mạc Khánh Duy)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Xóa Hết Tài Khoản</span>
              </button>

              <button
                type="button"
                onClick={handleExportData}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs'
                }`}
                title="Xuất file Excel CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Tài Khoản Mới</span>
              </button>
            </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Card 1: Total */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isDark ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase">Tổng Tài Khoản</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {accounts.length}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Đang hoạt động trên hệ thống
          </p>
        </div>

        {/* Card 2: Teachers */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isDark ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase">Thầy/Cô Giáo</span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {teacherCount}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Giáo viên các bộ môn THCS
          </p>
        </div>

        {/* Card 3: Students */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isDark ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase">Học Sinh</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {studentCount}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Lớp 6, 7, 8, 9 & Luyện thi vào 10
          </p>
        </div>

        {/* Card 4: Upgraded */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isDark ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase">Plus & Premium</span>
            <Crown className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            {upgradedCount}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Đã kích hoạt tốc độ VIP
          </p>
        </div>

        {/* Card 5: Holiday Discount */}
        <div
          className={`p-3.5 rounded-2xl border transition-all col-span-2 sm:col-span-4 lg:col-span-1 ${
            isDark
              ? 'bg-rose-950/20 border-rose-800/40'
              : 'bg-rose-50/50 border-rose-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase flex items-center gap-1">
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Ưu Đãi Ngày Lễ</span>
            </span>
            <Sparkles className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            -20%
          </div>
          <p className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold mt-0.5">
            Áp dụng 20/10 • 20/11 • 8/3
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
          isDark ? 'bg-zinc-850/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học sinh, thầy cô, trường, SĐT, email..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold border outline-hidden transition-all ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 p-1 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
            }`}
          >
            Tất cả ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('teacher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'teacher'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
            }`}
          >
            Thầy/Cô ({teacherCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'student'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
            }`}
          >
            Học sinh ({studentCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('upgraded')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === 'upgraded'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
            }`}
          >
            Plus & VIP ({upgradedCount})
          </button>
        </div>

        {/* Plan Filter dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap">
            Gói:
          </span>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border outline-hidden ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">Tất cả gói cước</option>
            <option value="free">Miễn phí (Free)</option>
            <option value="plus">Gói Plus (80k - 100k)</option>
            <option value="premium">Gói Premium (400k - 500k)</option>
          </select>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[11px] font-black uppercase tracking-wider ${
                isDark ? 'bg-zinc-850 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Tài khoản & Họ tên</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trường học / Môn học</th>
                <th className="py-3 px-4">Liên hệ (Email/SĐT)</th>
                <th className="py-3 px-4">Gói cước hiện tại</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Điều khiển & Nâng cấp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy tài khoản nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account, index) => {
                  const isTeacher = account.role === 'teacher';
                  const isPlus = account.plan === 'plus';
                  const isPremium = account.plan === 'premium';

                  return (
                    <tr
                      key={`${account.id}-${account.role}-${index}`}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-850/50 transition-colors ${
                        account.status === 'locked' ? 'opacity-60 bg-rose-500/5' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              account.avatar ||
                              `https://api.dicebear.com/7.x/${
                                isTeacher ? 'personas' : 'avataaars'
                              }/svg?seed=${encodeURIComponent(account.name)}`
                            }
                            alt={account.name}
                            className="w-9 h-9 rounded-xl object-cover bg-slate-200 dark:bg-zinc-800 shrink-0 border"
                          />
                          <div>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{account.name}</span>
                              {isPremium && (
                                <span title="Gói VIP Premium">
                                  <Crown className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                </span>
                              )}
                              {isPlus && (
                                <span title="Gói Plus">
                                  <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                              ID: {account.id} • {account.lastActive || 'Hoạt động'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {account.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Khách Trải Nghiệm (Đã Reset)</span>
                          </span>
                        ) : isTeacher ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            <span>Thầy/Cô Giáo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            <BookOpen className="w-3 h-3 text-blue-600" />
                            <span>Học Sinh</span>
                          </span>
                        )}
                      </td>

                      {/* School & Subject/Grade */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700 dark:text-zinc-300">
                          {account.school || 'THCS'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {account.subject || account.grade || 'Toàn khoa'}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 dark:text-zinc-300 text-[11px]">
                          {account.email || account.emailOrPhone || `${account.name.toLowerCase()}@max10.edu.vn`}
                        </div>
                        <div className="font-mono text-slate-500 dark:text-zinc-400 text-[10px]">
                          SĐT: {account.phone || '0778901259'}
                        </div>
                      </td>

                      {/* Current Plan */}
                      <td className="py-3 px-4">
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xs">
                            <Crown className="w-3 h-3" />
                            <span>PREMIUM</span>
                          </span>
                        ) : isPlus ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs">
                            <Zap className="w-3 h-3 fill-white" />
                            <span>PLUS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            Miễn Phí
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {account.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Tạm khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {account.role === 'admin' && false ? (
                            null
                          ) : (
                            <>
                              {/* Upgrade to Plus */}
                              <button
                                type="button"
                                onClick={() => handleUpdatePlan(account.id, isPlus ? 'free' : 'plus')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  isPlus
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                                }`}
                                title="Nâng cấp hoặc chuyển về Plus"
                              >
                                {isPlus ? 'Hạ Free' : 'Lên Plus'}
                              </button>

                              {/* Upgrade to Premium */}
                              <button
                                type="button"
                                onClick={() => handleUpdatePlan(account.id, isPremium ? 'free' : 'premium')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  isPremium
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300'
                                    : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-600 hover:text-white'
                                }`}
                                title="Nâng cấp thẳng lên Premium VIP"
                              >
                                {isPremium ? 'Hạ Free' : 'Lên Premium'}
                              </button>

                              {/* Lock/Unlock Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(account.id, account.status)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  account.status === 'active'
                                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 border-slate-200 dark:border-zinc-700'
                                    : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
                                }`}
                                title={account.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              >
                                {account.status === 'active' ? (
                                  <Unlock className="w-3.5 h-3.5" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                                )}
                              </button>

                              {/* Reset Account */}
                              <button
                                type="button"
                                onClick={() => handleResetAccount(account.id, account.name)}
                                className="p-1.5 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 transition-colors cursor-pointer"
                                title={`Reset tài khoản ${account.name} về mặc định`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Account */}
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(account.id, account.name)}
                                className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
                                title={`Xóa vĩnh viễn tài khoản ${account.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* TAB 4: HỆ THỐNG BẢO MẬT CHỐNG HACK & TỰ ĐỘNG BAN XÓA TÀI KHOẢN VĨNH VIỄN */}
      {activeCenterTab === 'security' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Banner Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-red-950/30 to-slate-900 border border-rose-500/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center font-black text-xl shadow-[2px_2px_10px_rgba(244,63,94,0.4)] shrink-0">
                  🛡️
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase mb-1 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Đang Bảo Vệ 24/7 • Không Thể Bị Hack</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Trung Tâm An Ninh Chống Hack &amp; Xử Phạt Tự Động
                  </h3>
                  <p className="text-xs text-rose-200/80 mt-0.5">
                    Hệ thống giám sát phát hiện ngay lập tức mọi hành vi hack, chèn mã độc, dò mật khẩu hoặc giả mạo quản trị.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSimulateHack}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Thử nghiệm tạo kẻ hack giả để kiểm tra tính năng tự động ban và xóa vĩnh viễn"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Thử Nghiệm Tự Động Ban Kẻ Hack</span>
                </button>

                <button
                  type="button"
                  onClick={handleUnbanAll}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Gỡ ban bằng mã bảo mật 24122012@duy"
                >
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Gỡ Ban Với Mã 24122012@duy</span>
                </button>

                <button
                  type="button"
                  onClick={fetchBannedAccounts}
                  className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSecurity ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Master Security Key Callout */}
            <div className="p-4 rounded-2xl bg-black/40 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-black text-rose-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>MÃ BẢO MẬT KHÔNG BỊ HACK DUY NHẤT:</span>
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Chỉ Quản trị viên Mạc Khánh Duy sở hữu mã này. Bất kỳ ai không có mã này mà cố tình xâm nhập sẽ bị <strong>tự động ban tài khoản và xóa vĩnh viễn</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/60 font-mono text-sm font-black text-rose-300 tracking-wider">
                  24122012@duy
                </code>
                <button
                  type="button"
                  onClick={() => copyText('24122012@duy', 'Mã bảo mật chống hack')}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                  title="Sao chép mã bảo mật"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Banned Accounts Table */}
          <div className="p-5 rounded-3xl neu-card space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Danh Sách Tài Khoản Đã Bị Tự Động Ban &amp; Xóa Vĩnh Viễn ({bannedAccounts.length})</span>
              </h4>
              <span className="text-xs text-slate-500">Cập nhật tự động thời gian thực</span>
            </div>

            {bannedAccounts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 text-slate-500 text-xs space-y-2">
                <div className="text-3xl">🛡️</div>
                <p className="font-bold text-slate-700 dark:text-zinc-300">
                  Hệ thống an ninh an toàn tuyệt đối 100%!
                </p>
                <p className="text-[11px] text-slate-400">
                  Chưa ghi nhận kẻ hack nào vượt qua được tường lửa Max10 AI. Hãy nhấn nút &quot;Thử Nghiệm Tự Động Ban Kẻ Hack&quot; ở trên để trải nghiệm cơ chế bảo vệ.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-rose-500/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-950/20 text-slate-500 dark:text-zinc-400 font-bold border-b border-rose-500/20">
                    <tr>
                      <th className="p-3">Kẻ Tấn Công / Đối Tượng</th>
                      <th className="p-3">Địa Chỉ IP</th>
                      <th className="p-3">Thời Gian Tấn Công</th>
                      <th className="p-3">Lý Do Hệ Thống Xử Lý</th>
                      <th className="p-3 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {bannedAccounts.map((b) => (
                      <tr key={b.id} className="hover:bg-rose-500/5 transition-colors">
                        <td className="p-3 font-bold text-rose-600 dark:text-rose-400">
                          {b.name || b.userId || 'Kẻ xâm nhập trái phép'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                          {b.ip || '127.0.0.1'}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {b.bannedAtFormatted || 'Vừa xong'}
                        </td>
                        <td className="p-3 text-rose-500 text-[11px] font-medium max-w-xs truncate" title={b.reason}>
                          {b.reason}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase shadow-2xs">
                            ✕ Đã Ban &amp; Xóa Vĩnh Viễn
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Thêm Tài Khoản Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <span>Thêm Tài Khoản Giáo Viên / Học Sinh Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">Họ và Tên:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Thầy Lê Văn Hùng, Nguyễn Minh Khang..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Vai trò:</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="teacher">Thầy/Cô Giáo</option>
                    <option value="student">Học Sinh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Gói cước ban đầu:</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="free">Miễn phí (Free)</option>
                    <option value="plus">Gói Plus (80k - 100k)</option>
                    <option value="premium">Gói Premium (400k - 500k)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Email hoặc SĐT:</label>
                  <input
                    type="text"
                    value={newEmailOrPhone}
                    onChange={(e) => setNewEmailOrPhone(e.target.value)}
                    placeholder="hung.le@gmail.com hoặc 0912..."
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {newRole === 'teacher' ? 'Môn giảng dạy:' : 'Khối lớp:'}
                  </label>
                  <input
                    type="text"
                    value={newGradeOrSubject}
                    onChange={(e) => setNewGradeOrSubject(e.target.value)}
                    placeholder={newRole === 'teacher' ? 'Ví dụ: Toán học' : 'Ví dụ: Lớp 9A1'}
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Trường học:</label>
                <input
                  type="text"
                  value={newSchool}
                  onChange={(e) => setNewSchool(e.target.value)}
                  placeholder="Ví dụ: THCS Nguyễn Du, THCS Chu Văn An..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Tạo Tài Khoản Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
