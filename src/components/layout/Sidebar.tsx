import React from 'react';
import { 
  LayoutGrid, 
  FileText, 
  ShieldCheck, 
  History, 
  BarChart2, 
  Settings, 
  Lock, 
  Layers, 
  HeartHandshake,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenExplorer: () => void;
  onOpenScanner: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenExplorer,
  onOpenScanner,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'records', label: 'My Records', icon: FileText },
    { id: 'consents', label: 'Consent Settings', icon: ShieldCheck },
    { id: 'timeline', label: 'Accountability Timeline', icon: History },
    { id: 'insights', label: 'Health Insights', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#f8fafc] border-r border-slate-200/90 flex flex-col justify-between shrink-0 p-4 min-h-[calc(100vh-61px)]">
      {/* Navigation List */}
      <div className="space-y-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#e0f2fe] text-[#0284c7] font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0284c7]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {/* Active Badge matching reference screenshot */}
              {isActive && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#bae6fd]/50 text-[#0284c7] rounded-md">
                  Active
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Trigger Buttons */}
        <div className="pt-6 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Simulators & Scanners
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Document AI Scanner</span>
          </button>

          <button
            type="button"
            onClick={onOpenExplorer}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>On-Chain Block Explorer</span>
          </button>
        </div>
      </div>

      {/* Trust & Crypto Status Footer */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 text-[11px]">
        <div className="flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3 h-3 text-emerald-600" />
            Storage Encryption
          </span>
          <span className="font-bold text-emerald-600">AES-256</span>
        </div>

        <div className="flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3 h-3 text-blue-600" />
            Blockchain State
          </span>
          <span className="font-bold text-blue-600">Verified ✓</span>
        </div>
      </div>
    </aside>
  );
};
