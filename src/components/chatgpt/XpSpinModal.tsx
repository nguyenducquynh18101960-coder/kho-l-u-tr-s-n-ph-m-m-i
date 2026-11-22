import React from 'react';
import { XpSpinScreen, XP_SPIN_POOL, XpSpinItem, XpSpinHistoryRecord } from './XpSpinScreen';

export { XP_SPIN_POOL };
export type { XpSpinItem, XpSpinHistoryRecord };

interface XpSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userName?: string;
}

export const XpSpinModal: React.FC<XpSpinModalProps> = ({
  isOpen,
  onClose,
  isDark,
  userName = 'Bạn học',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto select-none">
      <XpSpinScreen
        variant="modal"
        isDark={isDark}
        userName={userName}
        onClose={onClose}
      />
    </div>
  );
};
