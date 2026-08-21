import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, CheckCircle2, Lock, X, ChevronRight, Award, ArrowLeft } from 'lucide-react';
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme';
import type { Task } from '@/features/bolt-desktop/simulator/engine/TaskEngine';
import { useT } from '@/shared/i18n';

interface Props {
  theme: ThemeTokens;
  tasks: Task[];
  currentIndex: number;
  completed: Set<number>;
  xp: number;
  onShowHint: (task: Task) => void;
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
}

export function TaskPanel({
  theme,
  tasks,
  currentIndex,
  completed,
  xp,
  onShowHint: _onShowHint,
  isMobile,
  open,
  onClose,
}: Props) {
  const t = useT();
  const [showHint, setShowHint] = useState(false);
  const task = tasks[currentIndex];

  if (!open) return null;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme.bgElevated,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={16} color={theme.accent} />
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, letterSpacing: 0.5 }}>
            {t('desktopSimulator.tasksTitle').toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to="/practice"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: theme.accent,
              textDecoration: 'none',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            <ArrowLeft size={14} />
            {t('practiceShell.exitSim')}
          </Link>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.textMuted }}
            aria-label={t('desktopSimulator.tbTasks')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Current task */}
      <div style={{ padding: 16, borderBottom: `1px solid ${theme.border}` }}>
        {task ? (
          <>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: theme.textSubtle, marginBottom: 6 }}>
              {t('desktopSimulator.currentTaskLine', { id: task.id, total: tasks.length })}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 8, lineHeight: 1.4 }}>
              {task.title}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
              {task.description}
            </div>
            <button
              onClick={() => setShowHint((s) => !s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: `1px solid ${theme.borderStrong}`,
                borderRadius: 7,
                background: theme.bg,
                color: theme.text,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Lightbulb size={13} /> {showHint ? t('desktopSimulator.hideHint') : t('desktopSimulator.hint')}
            </button>
            {showHint && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 8,
                  background: theme.warning + '15',
                  border: `1px solid ${theme.warning}30`,
                  fontSize: 12,
                  color: theme.text,
                  lineHeight: 1.5,
                }}
              >
                {task.hint}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={36} color={theme.success} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>
              {t('desktopSimulator.allCompleteTitle')}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>
              {t('desktopSimulator.allCompleteDesc', { xp })}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>
          <span>{t('desktopSimulator.progress')}</span>
          <span>{completed.size}/{tasks.length}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: theme.border, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 3,
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentHover})`,
              width: `${(completed.size / tasks.length) * 100}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: theme.accent }}>
          {t('desktopSimulator.xpEarned', { xp })}
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {tasks.map((t, i) => {
          const isDone = completed.has(t.id);
          const isCurrent = i === currentIndex;
          const isLocked = i > currentIndex;
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: isCurrent ? theme.accentSoft : 'transparent',
                borderLeft: isCurrent ? `3px solid ${theme.accent}` : '3px solid transparent',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={16} color={theme.success} />
              ) : isLocked ? (
                <Lock size={14} color={theme.textMuted} />
              ) : (
                <ChevronRight size={16} color={theme.accent} />
              )}
              <span
                style={{
                  fontSize: 12,
                  color: isLocked ? theme.textMuted : isDone ? theme.textMuted : theme.text,
                  textDecoration: isDone ? 'line-through' : 'none',
                  flex: 1,
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {t.title}
              </span>
              <span style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600 }}>
                +{t.xp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 44,
          width: 300,
          zIndex: 9500,
          boxShadow: theme.shadow,
          borderLeft: `1px solid ${theme.border}`,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${theme.border}` }}>
      {content}
    </div>
  );
}
