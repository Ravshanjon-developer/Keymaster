import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import type { Notification } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';

const config = {
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  error: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
  warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  info: { icon: Info, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
};

export function Notifications() {
  const { state, dismissNotification } = useSimulator();

  return (
    <div className="fixed bottom-8 right-3 z-[95] flex flex-col gap-2 w-80 max-w-[90vw]">
      {state.notifications.map((notif: Notification) => {
        const c = config[notif.type];
        const Icon = c.icon;
        return (
          <div
            key={notif.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${c.bg} ${c.border} bg-surface-0 shadow-xl animate-slide-up`}
          >
            <Icon size={18} className={`${c.color} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">{notif.message}</div>
              {notif.detail && (
                <div className="text-2xs text-ink-dim mt-0.5">{notif.detail}</div>
              )}
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="shrink-0 p-0.5 text-ink-faint hover:text-ink transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
