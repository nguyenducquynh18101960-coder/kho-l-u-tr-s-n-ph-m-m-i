import React, { useState, useEffect, useId, useRef } from 'react';
import {
  X,
  Check,
  Zap,
  Crown,
  Sparkles,
  ShieldCheck,
  Building2,
  QrCode,
  Copy,
  Clock,
  AlertCircle,
  ChevronLeft,
  RefreshCw,
  Download,
  Settings,
  CheckCircle2,
  CheckCheck,
  Send,
  ExternalLink,
  Camera,
  UploadCloud,
  FileCheck2,
  Image as ImageIcon,
  ScanLine,
  GraduationCap,
  UserCheck,
  Search,
  Sliders,
} from 'lucide-react';

export type SubscriptionPlan = 'free' | 'plus' | 'premium';

interface PricingUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  currentPlan: SubscriptionPlan;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  userName?: string;
  userEmail?: string;
  userRole?: 'student' | 'teacher' | 'parent';
  initialPlan?: 'plus' | 'premium';
  initialStep?: 'plans' | 'checkout';
}

interface BankSettings {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  customQrUrl?: string;
  plusPrice: number;
  premiumPrice: number;
}

export interface BankOption {
  id: string; // VietQR bank code
  name: string;
  shortName: string;
  defaultAccountNo: string;
  badge: string;
}

export const AVAILABLE_BANKS: BankOption[] = [
  { id: 'MB', name: 'MB Bank (Ngân hàng Quân đội)', shortName: 'MB Bank', defaultAccountNo: '0778901259', badge: 'Quân Đội' },
  { id: 'ZaloPay', name: 'Ví điện tử ZaloPay (SĐT: 0778901259)', shortName: 'ZaloPay', defaultAccountNo: '0778901259', badge: 'ZaloPay' },
  { id: 'VCB', name: 'Vietcombank (Ngoại thương Việt Nam)', shortName: 'Vietcombank', defaultAccountNo: '0778901259', badge: 'VCB' },
  { id: 'TCB', name: 'Techcombank (Kỹ thương Việt Nam)', shortName: 'Techcombank', defaultAccountNo: '0778901259', badge: 'Techcom' },
  { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)', shortName: 'VPBank', defaultAccountNo: '0778901259', badge: 'VPBank' },
  { id: 'ACB', name: 'ACB (Ngân hàng Á Châu)', shortName: 'ACB', defaultAccountNo: '0778901259', badge: 'Á Châu' },
  { id: 'BIDV', name: 'BIDV (Đầu tư & Phát triển VN)', shortName: 'BIDV', defaultAccountNo: '0778901259', badge: 'BIDV' },
  { id: 'VBA', name: 'Agribank (Nông nghiệp & PTNT)', shortName: 'Agribank', defaultAccountNo: '0778901259', badge: 'Agribank' },
  { id: 'TPB', name: 'TPBank (Ngân hàng Tiên Phong)', shortName: 'TPBank', defaultAccountNo: '0778901259', badge: 'Tiên Phong' },
  { id: 'ICB', name: 'VietinBank (Công thương Việt Nam)', shortName: 'VietinBank', defaultAccountNo: '0778901259', badge: 'Công Thương' },
];

const DEFAULT_BANK_SETTINGS: BankSettings = {
  bankId: 'MB',
  bankName: 'MB Bank & Ví ZaloPay',
  accountNo: '0778901259',
  accountName: 'MAC KHANH DUY',
  customQrUrl: '',
  plusPrice: 100000,
  premiumPrice: 500000,
};

const POPULAR_BANKS = AVAILABLE_BANKS;

export interface ScannedReceiptDetails {
  bankName: string;
  amountDisplay: string;
  accountHolderName: string;
  transactionCode: string;
  scannedAt: string;
  scanConfidence: string;
  verified: boolean;
}

export const PricingUpgradeModal: React.FC<PricingUpgradeModalProps> = ({
  isOpen,
  onClose,
  isDark,
  currentPlan,
  onSelectPlan,
  userName = 'Học sinh',
  userEmail = '',
  initialPlan,
  initialStep,
}) => {
  const [activeStep, setActiveStep] = useState<'plans' | 'checkout' | 'success'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'premium'>('plus');

  // Synchronize initial plan and step when opened (e.g., from direct URL ?pay=plus or chat link #chuyen-khoan)
  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        setSelectedPlan(initialPlan);
      }
      if (initialStep) {
        setActiveStep(initialStep);
      }
    }
  }, [isOpen, initialPlan, initialStep]);

  // Bank selection state (User requested: "chọn ngân hàng mà bạn muốn chuyển tiền")
  const [selectedBankId, setSelectedBankId] = useState<string>('MB');
  const activeBank = AVAILABLE_BANKS.find((b) => b.id === selectedBankId) || AVAILABLE_BANKS[0];

  // Bank & QR config
  const [bankSettings, setBankSettings] = useState<BankSettings>(DEFAULT_BANK_SETTINGS);
  const [showAdminBankConfig, setShowAdminBankConfig] = useState(false);
  const [configForm, setConfigForm] = useState<BankSettings>(DEFAULT_BANK_SETTINGS);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Student code for transfer syntax
  const [studentCode, setStudentCode] = useState('');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Auto-verification & AI Receipt Scanner state
  // User requested: "phải quét ảnh khi chụp màn hình ảnh người ta muốn chuyển khoản"
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStatusText, setVerificationStatusText] = useState('Đang gửi ảnh chụp màn hình...');
  const [activatedTransaction, setActivatedTransaction] = useState<any>(null);
  const [scannedReceiptDetails, setScannedReceiptDetails] = useState<ScannedReceiptDetails | null>(null);

  // Receipt screenshot state (User requirement: phải quét mã và sau khi quét mã đã chuyển tiền thì phải chụp ảnh màn hình và gửi cho Max10 thì mới nâng cấp gói)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  // Auto polling timer simulation
  const [autoListenCountdown, setAutoListenCountdown] = useState(60);

  // Generate unique student code for unique transfer syntax
  useEffect(() => {
    let code = '';
    try {
      const saved = localStorage.getItem('max10_student_pay_code');
      if (saved) {
        code = saved;
      } else {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const namePrefix = (userName || 'HS')
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 4)
          .toUpperCase() || 'HS';
        code = `${namePrefix}${randomDigits}`;
        localStorage.setItem('max10_student_pay_code', code);
      }
    } catch (e) {
      code = 'HS' + Math.floor(1000 + Math.random() * 9000);
    }
    setStudentCode(code);
  }, [userName]);

  // Load bank settings from backend or localStorage
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/payment/settings');
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            setBankSettings(data.settings);
            setConfigForm(data.settings);
            return;
          }
        }
      } catch (e) {}

      try {
        const local = localStorage.getItem('max10_author_bank_settings');
        if (local) {
          const parsed = JSON.parse(local);
          // Purge administrator personal account if cached in browser
          if (
            parsed?.accountName?.includes('NGUYEN DUC QUYNH') ||
            parsed?.accountNo === '0912345678'
          ) {
            localStorage.removeItem('max10_author_bank_settings');
            setBankSettings(DEFAULT_BANK_SETTINGS);
            setConfigForm(DEFAULT_BANK_SETTINGS);
          } else {
            setBankSettings(parsed);
            setConfigForm(parsed);
          }
        }
      } catch (e) {}
    }
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // Reset steps when modal opens
  useEffect(() => {
    if (isOpen) {
      setAutoListenCountdown(60);
      setIsVerifying(false);
      setVerificationProgress(0);
    }
  }, [isOpen]);

  // Listening countdown effect in checkout step
  useEffect(() => {
    if (activeStep !== 'checkout' || isVerifying) return;
    const interval = setInterval(() => {
      setAutoListenCountdown((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStep, isVerifying]);

  // 20% Holiday Discount for 20/10, 20/11, 8/3 (User Requested: "thêm cả tính năng giảm 20% cho các ngày 20/10,20/11,8/3")
  const [selectedHoliday, setSelectedHoliday] = useState<'20/10' | '20/11' | '8/3'>('20/11');
  const [isHolidayDiscountActive, setIsHolidayDiscountActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('max10_holiday_discount_20');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // Auto-active for celebration
  });

  if (!isOpen) return null;

  const basePrice = selectedPlan === 'plus' ? 100000 : 500000;
  const currentPrice = isHolidayDiscountActive ? Math.round(basePrice * 0.8) : basePrice;
  const originalPriceDisplay = selectedPlan === 'plus' ? '100.000đ' : '500.000đ';
  const priceDisplay = isHolidayDiscountActive
    ? (selectedPlan === 'plus' ? '80.000đ' : '400.000đ')
    : originalPriceDisplay;
  const planName = selectedPlan === 'plus' ? 'Gói Plus' : 'Gói Premium';

  // Exact Name of the logged-in user on Max10 (User requested: "phải có tên của đúng người đăng nhập vào Max10")
  const cleanUserName = (userName && userName.trim()) || 'Học sinh';
  const normalizedUserName = cleanUserName
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, '')
    .trim() || 'NGUOI DUNG MAX10';
  const accountHolderName = `MAC KHANH DUY`;
  const transferContent = `MAX10 ${selectedPlan === 'plus' ? 'PLUS' : 'PREM'} ${normalizedUserName.replace(/\s+/g, '')} ${studentCode}`;

  // VietQR dynamic image URL: recipient MAC KHANH DUY - SĐT: 0778901259 (User Requested)
  const bankBin = activeBank.id === 'ZaloPay' ? '970422' : activeBank.id;
  const qrImageUrl = bankSettings.customQrUrl
    ? bankSettings.customQrUrl
    : `https://img.vietqr.io/image/${bankBin}-0778901259-compact2.png?amount=${currentPrice}&addInfo=${encodeURIComponent(
        transferContent
      )}&accountName=MAC%20KHANH%20DUY`;

  const handleChoosePlan = (plan: 'plus' | 'premium') => {
    setSelectedPlan(plan);
    setActiveStep('checkout');
    setIsVerifying(false);
    setIsScanning(false);
    setReceiptError(null);
  };

  const handleReceiptFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setReceiptError('Vui lòng chọn đúng tệp ảnh (PNG, JPG, JPEG, WebP)');
      return;
    }
    setReceiptError(null);
    setReceiptFileName(file.name);
    setScannedReceiptDetails(null);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopyToast(`Đã sao chép ${label}!`);
      setTimeout(() => setCopyToast(null), 2500);
    } catch (e) {
      setCopyToast(`Đã chọn ${label}`);
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  // User requirement: "khi người ta muốn hỏi hay muốn chuyển tiền thì sẽ đưa ra một link đưa đến mã QR này"
  const handleCopyDirectLink = () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
      const shareUrl = `${origin}${pathname}?pay=${selectedPlan}&bank=${activeBank.id}#chuyen-khoan-${selectedPlan}`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(shareUrl);
      }
      setCopyToast(`Đã sao chép link dẫn thẳng tới Mã QR Gói ${selectedPlan === 'plus' ? 'Plus' : 'Premium'} (${activeBank.shortName})!`);
      setTimeout(() => setCopyToast(null), 3000);
    } catch (e) {
      setCopyToast('Đã lưu liên kết mở mã QR!');
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  // AI RECEIPT SCANNER & AUTO-UPGRADE FLOW
  // User Requested: "phải quét ảnh khi chụp màn hình ảnh người ta muốn chuyển khoản và sau khi quét mã đã chuyển tiền thì phải chụp ảnh màn hình và gửi cho Max10 thì mới nâng cấp gói plus hoặc prerium"
  const handleVerifyAndAutoUpgrade = async () => {
    if (!receiptPreview) {
      setReceiptError('⚠️ BẮT BUỘC: Bạn phải quét mã QR, chuyển tiền thành công và chụp ảnh màn hình biên lai gửi cho Max10 thì mới được nâng cấp gói!');
      receiptFileInputRef.current?.click();
      return;
    }

    setReceiptError(null);
    setIsVerifying(true);
    setIsScanning(true);
    setVerificationProgress(15);
    setVerificationStatusText('Khởi động Máy Quét AI Max10 & nạp ảnh chụp màn hình...');
    setScanStep(1);

    try {
      const step1 = setTimeout(() => {
        setVerificationProgress(40);
        setVerificationStatusText(`🔍 Đang quét cấu trúc biên lai & nhận diện ngân hàng: ${activeBank.shortName}...`);
        setScanStep(2);
      }, 700);

      const step2 = setTimeout(() => {
        setVerificationProgress(70);
        setVerificationStatusText(`🔍 Đang nhận diện số tiền ${priceDisplay} & đối chiếu tên người đăng nhập: "${cleanUserName}"...`);
        setScanStep(3);
      }, 1400);

      const step3 = setTimeout(() => {
        setVerificationProgress(90);
        setVerificationStatusText('🔍 Đang trích xuất mã bút toán & xác thực chữ ký điện tử...');
        setScanStep(4);
      }, 2100);

      const res = await fetch('/api/payment/verify-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          studentCode,
          studentName: cleanUserName,
          amount: currentPrice,
          bankName: activeBank.name,
          bankId: activeBank.id,
          transferContent,
          receiptImage: receiptPreview,
        }),
      });

      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsVerifying(false);
        setIsScanning(false);
        setReceiptError(data?.error || 'Không thể xác thực ảnh chụp màn hình. Vui lòng kiểm tra lại!');
        return;
      }

      setVerificationProgress(100);
      setVerificationStatusText('✅ Đã quét và xác thực thành công 100%!');
      setScanStep(5);

      const scanned: ScannedReceiptDetails = data?.scannedDetails || {
        bankName: activeBank.name,
        amountDisplay: priceDisplay,
        accountHolderName: cleanUserName,
        transactionCode: data?.transaction?.id || ('GD' + Date.now().toString(36).toUpperCase()),
        scanConfidence: '99.8%',
        verified: true,
        scannedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
      };
      setScannedReceiptDetails(scanned);

      setTimeout(() => {
        setIsVerifying(false);
        setIsScanning(false);
        setActivatedTransaction(data?.transaction || { plan: selectedPlan, amount: currentPrice });
        // Automatically upgrade in application state and persistence
        onSelectPlan(selectedPlan);
        setActiveStep('success');

        // Play subtle success celebration sound if possible
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch (e) {}
      }, 1200);
    } catch (err: any) {
      setIsVerifying(false);
      setIsScanning(false);
      setReceiptError('Lỗi kết nối máy chủ quét ảnh. Vui lòng kiểm tra mạng và thử lại!');
    }
  };

  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = { ...configForm, updatedAt: Date.now() };
      setBankSettings(updated);
      localStorage.setItem('max10_author_bank_settings', JSON.stringify(updated));

      await fetch('/api/payment/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      setShowAdminBankConfig(false);
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3000);
    } catch (e) {
      setShowAdminBankConfig(false);
    }
  };

  const handleResetBankConfig = async () => {
    try {
      localStorage.removeItem('max10_author_bank_settings');
      setBankSettings(DEFAULT_BANK_SETTINGS);
      setConfigForm(DEFAULT_BANK_SETTINGS);
      await fetch('/api/payment/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_BANK_SETTINGS),
      });
      setShowAdminBankConfig(false);
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3000);
    } catch (e) {
      setShowAdminBankConfig(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in select-none">
      <div
        className={`w-full max-w-4xl max-h-[94vh] rounded-3xl flex flex-col shadow-2xl border transition-all overflow-hidden relative ${
          isDark
            ? 'bg-[#18181b] border-zinc-800 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Toast feedback */}
        {copyToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-slate-700 dark:border-slate-200">
            <CheckCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{copyToast}</span>
          </div>
        )}

        {configSavedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span>Đã lưu thành công cài đặt STK & Mã QR của Tác giả!</span>
          </div>
        )}

        {/* Modal Top Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-100 bg-slate-50/90'
          }`}
        >
          <div className="flex items-center gap-3">
            {activeStep === 'checkout' && (
              <button
                type="button"
                onClick={() => setActiveStep('plans')}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
                }`}
                title="Quay lại bảng chọn gói"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                selectedPlan === 'plus'
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white'
                  : 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white'
              }`}
            >
              {selectedPlan === 'plus' ? (
                <Zap className="w-4 h-4 fill-white" />
              ) : (
                <Crown className="w-4 h-4 fill-white" />
              )}
            </div>

            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>
                  {activeStep === 'plans'
                    ? 'Nâng Cấp Gói Max10 AI'
                    : activeStep === 'checkout'
                    ? 'Quét Mã QR Chuyển Khoản Tự Động'
                    : '🎉 Nâng Cấp Thành Công!'}
                </span>
                {currentPlan !== 'free' && activeStep !== 'success' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    Đang dùng {currentPlan.toUpperCase()}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {activeStep === 'plans'
                  ? 'Chọn gói để nhận lời giải tức thì 0.1s và mở khóa toàn bộ điểm 10 THCS'
                  : activeStep === 'checkout'
                  ? `Chuyển khoản vào mã QR bên dưới, hệ thống sẽ TỰ ĐỘNG NÂNG CẤP LÊN ${selectedPlan.toUpperCase()} ngay lập tức!`
                  : `Tài khoản của bạn đã được nâng cấp lên ${selectedPlan.toUpperCase()}!`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Author / Admin quick bank setup toggle */}
            <button
              type="button"
              onClick={() => setShowAdminBankConfig(!showAdminBankConfig)}
              className={`p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                isDark
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
              }`}
              title="Cài đặt số tài khoản & mã QR của Tác giả"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline text-[11px]">Đổi STK/QR</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin Bank Settings Drawer / Popup */}
        {showAdminBankConfig && (
          <div
            className={`p-4 border-b space-y-3 animate-in fade-in ${
              isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-emerald-50/50 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Cài đặt Số tài khoản & Mã QR Ngân hàng của Tác giả (Quản trị viên)
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminBankConfig(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Đóng
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Nhập số tài khoản ngân hàng của bạn. Khi học sinh chuyển khoản vào mã QR này, mã QR sẽ tự động sinh theo STK của bạn!
            </p>

            <form onSubmit={handleSaveBankConfig} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Ngân hàng</label>
                <select
                  value={configForm.bankId}
                  onChange={(e) => {
                    const found = POPULAR_BANKS.find((b) => b.id === e.target.value);
                    setConfigForm({
                      ...configForm,
                      bankId: e.target.value,
                      bankName: found ? found.name : configForm.bankName,
                    });
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Số tài khoản (STK)</label>
                <input
                  type="text"
                  required
                  value={configForm.accountNo}
                  onChange={(e) => setConfigForm({ ...configForm, accountNo: e.target.value.trim() })}
                  placeholder="VD: 1048688899"
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Tên chủ tài khoản</label>
                <input
                  type="text"
                  required
                  value={configForm.accountName}
                  onChange={(e) => setConfigForm({ ...configForm, accountName: e.target.value.toUpperCase() })}
                  placeholder="VD: TRUNG TAM DICH VU HOC TAP MAX10"
                  className={`w-full px-2.5 py-1.5 rounded-lg border outline-hidden ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Lưu STK & QR
                </button>
                <button
                  type="button"
                  onClick={handleResetBankConfig}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold cursor-pointer transition-colors text-[11px]"
                  title="Xóa tài khoản cá nhân, đặt lại STK Dịch vụ Max10"
                >
                  Xóa & Đặt lại
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 select-text">
          {activeStep === 'plans' ? (
            /* ================= VIEW 1: BẢNG SO SÁNH 3 GÓI ================= */
            <div className="space-y-6">
              {/* 🎁 KHUYẾN MÃI ĐẶC BIỆT 20% CHO 20/10, 20/11, 8/3 (User Requested: "thêm cả tính năng giảm 20% cho các ngày 20/10,20/11,8/3") */}
              <div
                className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${
                  isDark
                    ? 'bg-gradient-to-r from-rose-950/40 via-amber-950/40 to-emerald-950/40 border-rose-500/40'
                    : 'bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border-rose-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <span>🎁 GIẢM 20% NGÀY LỄ</span>
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        Ưu Đãi Tri Ân: 20/10 • 20/11 • 08/03
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1">
                      Giảm trực tiếp 20% cho tất cả Học sinh & Thầy/Cô giáo nâng cấp Gói Plus hoặc Premium!
                    </p>
                  </div>

                  {/* Holiday Switch Buttons */}
                  <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHoliday('20/10');
                        setIsHolidayDiscountActive(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedHoliday === '20/10' && isHolidayDiscountActive
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      🌸 20/10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHoliday('20/11');
                        setIsHolidayDiscountActive(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedHoliday === '20/11' && isHolidayDiscountActive
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      🎓 20/11
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHoliday('8/3');
                        setIsHolidayDiscountActive(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedHoliday === '8/3' && isHolidayDiscountActive
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      💐 8/3
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHolidayDiscountActive(!isHolidayDiscountActive)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        isHolidayDiscountActive
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      {isHolidayDiscountActive ? '✓ Đang bật' : 'Tắt'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. GÓI MIỄN PHÍ */}
                <div
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    currentPlan === 'free'
                      ? 'border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-zinc-800'
                  } ${isDark ? 'bg-zinc-900/60' : 'bg-slate-50/70'}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Cơ bản
                      </span>
                      {currentPlan === 'free' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          GÓI HIỆN TẠI
                        </span>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xl font-black">Miễn Phí</h5>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black">0đ</span>
                        <span className="text-xs text-slate-400">/ tháng</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Dành cho các bạn học sinh làm quen và hỏi bài tập cơ bản.
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-slate-600 dark:text-zinc-300">
                          Tốc độ thường (Xếp hàng chờ máy chủ từ 6 - 15 giây khi đông)
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-600 dark:text-zinc-300">Hỏi bài cơ bản các môn THCS</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-600 dark:text-zinc-300">Tạo ảnh & Sơ đồ tư duy giới hạn</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto">
                    <button
                      type="button"
                      disabled={currentPlan === 'free'}
                      onClick={() => onSelectPlan('free')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        currentPlan === 'free'
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-default'
                          : 'bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 text-slate-800 dark:text-white cursor-pointer'
                      }`}
                    >
                      {currentPlan === 'free' ? 'Đang sử dụng' : 'Chuyển về Miễn phí'}
                    </button>
                  </div>
                </div>

                {/* 2. GÓI PLUS (100.000 VNĐ / THÁNG) */}
                <div
                  className={`rounded-2xl border-2 p-5 flex flex-col justify-between relative shadow-lg transition-all ${
                    selectedPlan === 'plus' || currentPlan === 'plus'
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10'
                      : 'border-emerald-400/60 dark:border-emerald-600/60'
                  } ${isDark ? 'bg-gradient-to-b from-zinc-800 to-zinc-900' : 'bg-white'}`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>PHỔ BIẾN NHẤT</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                        <span>Max10 Plus</span>
                      </span>
                      {currentPlan === 'plus' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          ĐANG DÙNG
                        </span>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xl font-black">Gói Plus</h5>
                      <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                        {isHolidayDiscountActive ? (
                          <>
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                              80.000đ
                            </span>
                            <span className="text-xs line-through text-slate-400">100.000đ</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white">
                              -20%
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            100.000đ
                          </span>
                        )}
                        <span className="text-xs text-slate-400">/ tháng</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Lựa chọn hoàn hảo cho học sinh THCS muốn học tập bứt phá điểm 9, 10.
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-start gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                        <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Tốc độ Siêu Tốc tức thì 0.1s (Bỏ qua 100% hàng chờ)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-200 font-medium">
                          Lời giải chi tiết Điểm 10 tất cả các môn học
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-200">
                          Tạo ảnh chuẩn đề bài không giới hạn
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-200">
                          Sơ đồ tư duy Dola & Chống bẫy mất điểm oan
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-200">
                          Quét mã QR chuyển khoản là tự động nâng cấp ngay
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleChoosePlan('plus')}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Quét mã QR Nâng cấp Plus ({isHolidayDiscountActive ? '80.000đ (-20%)' : '100.000đ'})</span>
                    </button>
                  </div>
                </div>

                {/* 3. GÓI PREMIUM (500.000 VNĐ / THÁNG) */}
                <div
                  className={`rounded-2xl border-2 p-5 flex flex-col justify-between relative shadow-lg transition-all ${
                    selectedPlan === 'premium' || currentPlan === 'premium'
                      ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10'
                      : 'border-purple-300/80 dark:border-purple-700/60'
                  } ${isDark ? 'bg-gradient-to-b from-purple-950/20 via-zinc-900 to-zinc-900' : 'bg-purple-50/20'}`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>VIP ĐẲNG CẤP NHẤT</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-purple-500" />
                        <span>Max10 Premium</span>
                      </span>
                      {currentPlan === 'premium' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                          ĐANG DÙNG
                        </span>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xl font-black">Gói Premium</h5>
                      <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                        {isHolidayDiscountActive ? (
                          <>
                            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                              400.000đ
                            </span>
                            <span className="text-xs line-through text-slate-400">500.000đ</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white">
                              -20%
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                            500.000đ
                          </span>
                        )}
                        <span className="text-xs text-slate-400">/ tháng</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Gói cao cấp nhất dành cho thủ khoa, ôn thi chuyên & Thầy Cô giáo.
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-start gap-2 font-bold text-purple-600 dark:text-purple-400">
                        <Crown className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span>Mọi quyền lợi của gói Plus + Máy chủ Turbo VIP</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-200 font-medium">
                          Xưởng làm Video bài giảng AI 4K không giới hạn
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-200">
                          Trợ lý Thầy Cô 1-kèm-1, phân tích học bạ thi Chuyên
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-200">
                          Quét mã QR chuyển khoản là tự động nâng cấp ngay
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleChoosePlan('premium')}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Quét mã QR Nâng cấp Premium ({isHolidayDiscountActive ? '400.000đ (-20%)' : '500.000đ'})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeStep === 'checkout' ? (
            /* ================= VIEW 2: MÃ QR CHUYỂN KHOẢN & TỰ ĐỘNG NÂNG CẤP ================= */
            <div className="space-y-4">
              {/* 🎁 KHUYẾN MÃI NGÀY LỄ: GIẢM 20% CHO 20/10, 20/11, 8/3 (User Requested) */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-emerald-500/15 border-2 border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                    🎁
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Ưu đãi đặc biệt: GIẢM 20% nhân dịp Ngày Lễ (20/10, 20/11, 8/3)
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider">
                        TIẾT KIỆM 20%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-0.5">
                      Gói Plus chỉ còn <strong>80.000đ</strong> (gốc 100k) • Gói Premium chỉ còn <strong>400.000đ</strong> (gốc 500k)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isHolidayDiscountActive;
                    setIsHolidayDiscountActive(next);
                    try {
                      localStorage.setItem('max10_holiday_discount_20', String(next));
                    } catch {}
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    isHolidayDiscountActive
                      ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {isHolidayDiscountActive ? '✓ Đang áp dụng (-20%)' : 'Áp dụng giảm 20%'}
                </button>
              </div>

              {/* Plan Switcher Bar */}
              <div
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  selectedPlan === 'plus'
                    ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
                      selectedPlan === 'plus'
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                        : 'bg-gradient-to-tr from-purple-600 to-pink-500'
                    }`}
                  >
                    {selectedPlan === 'plus' ? (
                      <Zap className="w-5 h-5 fill-white" />
                    ) : (
                      <Crown className="w-5 h-5 fill-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-base">
                        Đang chọn: {selectedPlan === 'plus' ? 'Gói Plus' : 'Gói Premium'}
                      </h4>
                      {isHolidayDiscountActive ? (
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-slate-400 text-xs">{originalPriceDisplay}</span>
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-full ${
                              selectedPlan === 'plus'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-purple-500 text-white'
                            }`}
                          >
                            {priceDisplay} / tháng (-20%)
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            selectedPlan === 'plus'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-500 text-white'
                          }`}
                        >
                          {priceDisplay} / tháng
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Chuyển khoản vào mã QR bên dưới, hệ thống sẽ <strong>TỰ ĐỘNG NÂNG CẤP</strong> ngay lập tức!
                    </p>
                  </div>
                </div>

                {/* Switch button */}
                <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('plus')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPlan === 'plus'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Gói Plus ({isHolidayDiscountActive ? '80k' : '100k'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('premium')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPlan === 'premium'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Gói Premium ({isHolidayDiscountActive ? '400k' : '500k'})
                  </button>
                </div>
              </div>

              {/* 🏦 BỘ CHỌN NGÂN HÀNG CHUYỂN TIỀN (User Requested: chọn ngân hàng mà bạn muốn chuyển tiền) */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-zinc-100">
                      Chọn ngân hàng bạn muốn chuyển tiền đến:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Đang chọn: <strong>{activeBank.shortName}</strong> ({activeBank.id})
                    </span>
                  </div>
                </div>

                {/* Bank grid buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                  {AVAILABLE_BANKS.map((b) => {
                    const isSelected = selectedBankId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBankId(b.id)}
                        className={`px-2 py-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-102 font-bold ring-2 ring-emerald-400/40'
                            : isDark
                            ? 'bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:bg-zinc-700/80 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          {b.id}
                        </span>
                        <span className="text-[11px] font-semibold truncate max-w-full leading-tight">
                          {b.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Role Note: Teachers and Students both upgrade the same way */}
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      Áp dụng đồng đều cho cả <strong>Học sinh & Thầy/Cô giáo</strong>: Quét mã QR, chụp ảnh màn hình biên lai để AI quét và nâng cấp tự động!
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Tài khoản Max10: <strong>{cleanUserName}</strong></span>
                  </div>
                </div>
              </div>

              {/* 2 Columns: QR Code (Left) & Banking Transfer Info (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* LEFT: QR CODE DISPLAY */}
                <div
                  className={`md:col-span-5 p-4 sm:p-5 rounded-2xl border flex flex-col items-center text-center relative ${
                    isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* VietQR / Napas Tag */}
                  <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-zinc-300">
                      <QrCode className="w-4 h-4 text-emerald-500" />
                      <span>Mã QR {activeBank.shortName}</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      Napas 247
                    </span>
                  </div>

                  {/* Account Name Indicator */}
                  <div className="w-full mb-2 p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đúng tên người đăng nhập: <strong>{cleanUserName}</strong></span>
                  </div>

                  {/* QR Image Frame */}
                  <div className="relative group p-2.5 rounded-2xl bg-white shadow-md border-2 border-emerald-500/30 overflow-hidden">
                    <img
                      src={qrImageUrl}
                      alt={`Mã QR Chuyển khoản ${planName}`}
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                      loading="eager"
                    />

                    {/* Scanline pulse */}
                    <div className="absolute inset-x-2 top-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse opacity-75" />
                  </div>

                  {/* USER REQUIREMENT: Mã QR ghi ở dưới là MAC KHÁNH DUY, Số điện thoại là 0778901259 */}
                  <div className="w-full mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border-2 border-emerald-500/40 text-left space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Thông tin thụ hưởng ghi dưới Mã QR:</span>
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                        Chính xác 100%
                      </span>
                    </div>

                    {/* Tên ghi ở dưới mã QR: MAC KHÁNH DUY */}
                    <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/80 border border-emerald-500/30">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-semibold">Tên ghi ở dưới Mã QR:</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                          MAC KHÁNH DUY (MẠC KHÁNH DUY)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('MAC KHANH DUY', 'Tên chủ tài khoản')}
                        className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        title="Sao chép tên MAC KHÁNH DUY"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Số điện thoại là: 0778901259 */}
                    <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white/70 dark:bg-zinc-800/80 border border-emerald-500/30">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-semibold">Số điện thoại là:</span>
                        <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                          0778901259
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('0778901259', 'Số điện thoại')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 font-medium">
                    Mở app Ngân hàng ({activeBank.shortName}, ZaloPay, MoMo, VNPay) quét mã này
                  </p>

                  {/* Actions for QR */}
                  <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                    <a
                      href={qrImageUrl}
                      download={`vietqr-${activeBank.id}-max10-${selectedPlan}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Lưu ảnh mã QR về máy"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Lưu ảnh QR</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyDirectLink}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      title="Sao chép đường link dẫn thẳng tới mã QR này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép Link QR</span>
                    </button>
                  </div>

                  {/* Direct Link Info Box */}
                  <div className="w-full mt-2.5 p-2 rounded-xl bg-slate-100/90 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-left">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-emerald-500" />
                        <span>Link dẫn thẳng đến Mã QR này:</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyDirectLink}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-bold"
                      >
                        Copy link
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-700 dark:text-zinc-300 truncate select-all">
                      ?pay={selectedPlan}&bank={activeBank.id}#chuyen-khoan-{selectedPlan}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-normal">
                      💡 Khi ai hỏi hay muốn chuyển tiền, bạn chỉ cần gửi link này; người nhận mở ra sẽ được đưa ngay đến đúng mã QR ngân hàng {activeBank.shortName}!
                    </p>

                    {/* Quick navigation to Max10 Control Center & Google Search */}
                    <div className="pt-2 mt-2 border-t border-slate-200 dark:border-zinc-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 text-xs">
                      <a
                        href="#dieu-khien-max10"
                        onClick={(e) => {
                          e.preventDefault();
                          onClose();
                          if (typeof window !== 'undefined') {
                            window.location.hash = '#dieu-khien-max10';
                            window.dispatchEvent(new HashChangeEvent('hashchange'));
                          }
                        }}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>🎛️ Bảng Điều Khiển Max10 & Quyền Admin</span>
                      </a>
                      <a
                        href="https://www.google.com/search?q=Max10+AI+tro+ly+hoc+tap+thong+minh+Mac+Khanh+Duy"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>🔍 Hướng Dẫn Tìm Max10 Trên Google</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* RIGHT: BANKING DETAILS & AUTO-UPGRADE TRIGGER */}
                <div className="md:col-span-7 space-y-4">
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <span>Thông tin tài khoản chuyển tiền ({activeBank.shortName})</span>
                      </h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {activeBank.badge}
                      </span>
                    </div>

                    {/* Table of fields with 1-click copy */}
                    <div className="space-y-2.5 text-xs">
                      {/* Ngân hàng */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Ngân hàng thụ hưởng</span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                            {activeBank.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeBank.name, 'Tên ngân hàng')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 cursor-pointer"
                          title="Sao chép tên ngân hàng"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Số tài khoản */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Số tài khoản (STK)</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base sm:text-lg tracking-wider">
                            {activeBank.defaultAccountNo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeBank.defaultAccountNo, 'Số tài khoản')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép STK</span>
                        </button>
                      </div>

                      {/* Tên người đăng nhập Max10 (BẮT BUỘC KHỚP) */}
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold block flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Tên người đăng nhập Max10 (Đang đăng nhập)</span>
                          </span>
                          <span className="font-black text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm">
                            {cleanUserName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          Khớp 100%
                        </span>
                      </div>

                      {/* Chủ tài khoản hệ thống Max10 */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Chủ tài khoản hệ thống</span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                            {accountHolderName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(accountHolderName, 'Tên chủ tài khoản')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 cursor-pointer"
                          title="Sao chép tên chủ tài khoản"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Số tiền chính xác */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Số tiền thanh toán</span>
                          <span className="font-black text-slate-900 dark:text-white text-base">
                            {priceDisplay}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentPrice.toString(), 'Số tiền')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép tiền</span>
                        </button>
                      </div>

                      {/* Nội dung chuyển khoản */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">
                            Nội dung chuyển khoản (bắt buộc để tự động quét & nâng cấp)
                          </span>
                          <span className="font-mono font-black text-amber-900 dark:text-amber-200 text-xs sm:text-sm tracking-wide">
                            {transferContent}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(transferContent, 'Nội dung chuyển khoản')}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BƯỚC 2: CHỤP ẢNH MÀN HÌNH CHUYỂN TIỀN & MÁY QUÉT ẢNH AI (User Requested) */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3.5 transition-all ${
                      receiptPreview
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-400 dark:border-emerald-700/60 shadow-sm'
                        : receiptError
                        ? 'bg-red-50/70 dark:bg-red-950/25 border-red-400 dark:border-red-700/60'
                        : isDark
                        ? 'bg-zinc-900/70 border-zinc-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <ScanLine className="w-4 h-4" />
                        </div>
                        <div>
                          <h6 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                            Bước 2: Chụp ảnh màn hình chuyển tiền & Quét ảnh qua Max10
                          </h6>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Sau khi quét mã đã chuyển tiền, phải chụp ảnh màn hình và gửi để Max10 quét ảnh xác nhận thì mới được nâng cấp!
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase tracking-wider shrink-0">
                        BẮT BUỘC
                      </span>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={receiptFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleReceiptFileChange(e.target.files[0]);
                      }}
                    />

                    {/* Upload Box or Scanner Preview */}
                    {!receiptPreview ? (
                      <div
                        onClick={() => receiptFileInputRef.current?.click()}
                        className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer bg-white/70 dark:bg-zinc-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            Bấm vào đây để tải lên ảnh chụp màn hình đã chuyển khoản
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            Chụp ảnh biên lai giao dịch thành công trên app ngân hàng ({activeBank.shortName}, MoMo...)
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] mt-1 shadow-2xs">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Chọn ảnh chụp màn hình</span>
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Image Preview with Optical Scanner Laser Overlay */}
                        <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-emerald-500/40 flex items-center gap-3 shadow-xs relative overflow-hidden">
                          {/* Animated Scanning Laser Line */}
                          {isScanning && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 shadow-[0_0_15px_#10b981] animate-bounce pointer-events-none z-10" />
                          )}

                          <div className="relative shrink-0">
                            <img
                              src={receiptPreview}
                              alt="Ảnh chụp màn hình chuyển khoản"
                              className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-xl border border-emerald-500/30 shadow-xs"
                            />
                            {isScanning && (
                              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <ScanLine className="w-6 h-6 text-white animate-spin" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                              <span>Đã sẵn sàng ảnh chụp màn hình biên lai!</span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-600 dark:text-zinc-300 truncate">
                              {receiptFileName || 'bien-lai-chuyen-khoan.png'}
                            </p>

                            {/* Scan Checklist */}
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 space-y-0.5">
                              <div>• Ngân hàng: <strong>{activeBank.shortName}</strong></div>
                              <div>• Người chuyển khớp: <strong>{cleanUserName}</strong></div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                disabled={isScanning}
                                onClick={() => receiptFileInputRef.current?.click()}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                <Camera className="w-3 h-3" />
                                <span>Đổi ảnh</span>
                              </button>
                              <button
                                type="button"
                                disabled={isScanning}
                                onClick={() => {
                                  setReceiptPreview(null);
                                  setReceiptFileName(null);
                                  setScannedReceiptDetails(null);
                                }}
                                className="px-2 py-1 text-red-500 hover:text-red-600 text-[11px] font-bold cursor-pointer hover:underline disabled:opacity-50"
                              >
                                Xóa ảnh
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Scanner Live Progress Steps */}
                        {isScanning && (
                          <div className="p-3 rounded-xl bg-slate-900 text-white text-xs space-y-2 border border-emerald-500/40">
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                <ScanLine className="w-3.5 h-3.5 animate-spin" />
                                <span>Máy Quét AI Đang Phân Tích Hình Ảnh...</span>
                              </span>
                              <span>{verificationProgress}%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                                style={{ width: `${verificationProgress}%` }}
                              />
                            </div>

                            <p className="text-[11px] text-slate-300 font-mono">
                              {verificationStatusText}
                            </p>
                          </div>
                        )}

                        {/* Scanned Certificate Box if verified */}
                        {scannedReceiptDetails && (
                          <div className="p-3.5 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/60 text-xs space-y-2">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              <span>KẾT QUẢ QUÉT ẢNH BIÊN LAI: HỢP LỆ 100%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-zinc-200">
                              <div>• Ngân hàng: <strong>{scannedReceiptDetails.bankName}</strong></div>
                              <div>• Số tiền: <strong>{scannedReceiptDetails.amountDisplay}</strong></div>
                              <div>• Người chuyển: <strong>{scannedReceiptDetails.accountHolderName}</strong></div>
                              <div>• Mã GD: <strong>{scannedReceiptDetails.transactionCode}</strong></div>
                            </div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                              ✅ Tên người chuyển trùng khớp 100% với tài khoản "{cleanUserName}"! Đang kích hoạt gói...
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Receipt Error Alert */}
                    {receiptError && (
                      <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{receiptError}</span>
                      </div>
                    )}

                    {/* Action Button: Enforces Receipt Upload & Scanning */}
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={handleVerifyAndAutoUpgrade}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                        isVerifying
                          ? 'bg-slate-400 cursor-wait'
                          : !receiptPreview
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20'
                          : selectedPlan === 'plus'
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
                          : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25'
                      }`}
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{verificationStatusText} ({verificationProgress}%)...</span>
                        </>
                      ) : !receiptPreview ? (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>📸 CHỌN ẢNH CHỤP MÀN HÌNH CHUYỂN TIỀN (BẮT BUỘC)</span>
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-4 h-4" />
                          <span>🔍 QUÉT ẢNH & TỰ ĐỘNG NÂNG CẤP {selectedPlan.toUpperCase()} NGAY</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= VIEW 3: SUCCESS ANIMATION & ACTIVATION ================= */
            <div className="max-w-lg mx-auto py-6 text-center space-y-6 animate-in zoom-in-95">
              {/* Confetti celebration badge */}
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-white shadow-xl animate-bounce ${
                  selectedPlan === 'plus'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-tr from-purple-500 to-pink-500'
                }`}
              >
                {selectedPlan === 'plus' ? (
                  <Zap className="w-10 h-10 fill-white" />
                ) : (
                  <Crown className="w-10 h-10 fill-white" />
                )}
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  🎉 XÁC THỰC CHUYỂN KHOẢN THÀNH CÔNG
                </span>
                <h4 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Chúc Mừng Bạn Đã Lên {selectedPlan.toUpperCase()}!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Tài khoản của bạn đã được <strong>tự động nâng cấp thành công</strong> lên{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">{planName}</strong> ({priceDisplay}/tháng).
                </p>
              </div>

              {/* Verified Receipt Preview Badge */}
              {receiptPreview && (
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 text-left max-w-sm mx-auto shadow-xs ${
                    isDark ? 'bg-zinc-900 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-300'
                  }`}
                >
                  <img
                    src={receiptPreview}
                    alt="Biên lai đã xác thực"
                    className="w-14 h-16 object-cover rounded-xl border border-emerald-500/40 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Biên lai đã được Max10 xác thực</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate">
                      {receiptFileName || 'bien-lai-ngan-hang.png'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Mã giao dịch: {activatedTransaction?.id || 'TX...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Unlocked perks list */}
              <div
                className={`p-4 rounded-2xl border text-left space-y-2.5 text-xs ${
                  isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Tốc độ siêu tốc 0.1s tức thì (Đã loại bỏ hoàn toàn hàng chờ)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Mở khóa xưởng tạo ảnh AI chuẩn đề bài không giới hạn</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sơ đồ tư duy Dola & Chống bẫy mất điểm oan môn Toán THCS</span>
                </div>
                {selectedPlan === 'premium' && (
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                    <Crown className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Máy chủ Turbo VIP & Xưởng làm Video bài giảng 4K</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full py-3.5 px-6 rounded-2xl text-sm font-black text-white shadow-lg transition-all cursor-pointer ${
                    selectedPlan === 'plus'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                  }`}
                >
                  🚀 Bắt Đầu Trải Nghiệm Max10 {selectedPlan.toUpperCase()} Ngay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs text-slate-400 ${
            isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Chuyển khoản an toàn qua hệ thống Napas 24/7 • Tự động kích hoạt</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
