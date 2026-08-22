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
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex w-64 bg-[#F7F4ED] border-r border-[#E8E1D5] flex-col justify-between shrink-0 p-4 min-h-[calc(100vh-61px)]">
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
                    ? 'bg-[#EAE2D5] text-[#2B2521] font-bold shadow-xs border border-[#DFD4C4]'
                    : 'text-[#63594F] hover:bg-[#EFE9DE] hover:text-[#2B2521]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C85A3B]' : 'text-[#82786D]'}`} />
                  <span>{item.label}</span>
                </div>

                {/* Active Badge */}
                {isActive && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#DFD4C4] text-[#6A3924] rounded-md">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sovereign Trust & Cryptographic Ledger Footer */}
        <button
          type="button"
          onClick={onOpenExplorer}
          className="p-3.5 rounded-2xl bg-white hover:bg-[#FDF8F5] border border-[#E8E1D5] hover:border-[#C85A3B] shadow-xs space-y-2 text-[11px] text-left transition-all cursor-pointer group"
          title="Click to inspect cryptographic on-chain ledger"
        >
          <div className="flex items-center justify-between text-[#63594F]">
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#2D6346]" />
              <span>Sovereign Storage</span>
            </span>
            <span className="font-mono text-[#2D6346] font-bold">AES-256</span>
          </div>
          <div className="flex items-center justify-between text-[#63594F]">
            <span className="flex items-center gap-1.5 font-medium">
              <HeartHandshake className="w-3.5 h-3.5 text-[#C85A3B]" />
              <span>Consensus</span>
            </span>
            <span className="font-mono text-[#2B2521] font-bold group-hover:text-[#C85A3B] transition-colors">
              PoA Ledger ↗
            </span>
          </div>
        </button>
      </aside>

      {/* Mobile Bottom Navigation Bar (fixed for mobile screens) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E8E1D5] px-2 py-2 shadow-lg items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer min-w-[50px] ${
                isActive
                  ? 'text-[#C85A3B] font-black scale-105'
                  : 'text-[#82786D] hover:text-[#2B2521]'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-[#FDF8F5] border border-[#E8DEC8]' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px] text-center">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
