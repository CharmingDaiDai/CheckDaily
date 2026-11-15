import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Check, Clock3, NotebookPen, Pencil, Trash2, X } from "lucide-react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { HabitIcon } from '@/lib/habitIcons'
import { useDeleteCheckIn, useUpdateCheckIn } from "@/hooks/useCheckIns";
import { toast } from "@/hooks/useToast";
import type { CheckIn } from "@/types";

type HabitMeta = {
  name: string;
  color: string;
  icon: string;
};

interface CheckInDayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  checkIns: CheckIn[];
  habitsMap: Record<string, HabitMeta>;
}

export function CheckInDayDetailDialog({
  open,
  onOpenChange,
  dateLabel,
  checkIns,
  habitsMap,
}: CheckInDayDetailDialogProps) {
  const updateCheckIn = useUpdateCheckIn();
  const deleteCheckIn = useDeleteCheckIn();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Reset transient row state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setDraftNote("");
      setPendingDeleteId(null);
    }
  }, [open]);

  const orderedCheckIns = useMemo(
    () => [...checkIns].sort((a, b) => a.checked_at.localeCompare(b.checked_at)),
    [checkIns],
  );

  const backdatedCount = useMemo(
    () =>
      orderedCheckIns.filter(
        (ci) => formatDate(ci.checked_at) !== formatDate(ci.created_at),
      ).length,
    [orderedCheckIns],
  );

  function startEditing(ci: CheckIn) {
    setPendingDeleteId(null);
    setEditingId(ci.id);
    setDraftNote(ci.note ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftNote("");
  }

  async function saveNote(ci: CheckIn) {
    const next = draftNote.trim();
    try {
      await updateCheckIn.mutateAsync({ id: ci.id, note: next || null });
      setEditingId(null);
      setDraftNote("");
      toast.success("备注已保存");
    } catch {
      // error handled in useUpdateCheckIn
    }
  }

  async function removeCheckIn(ci: CheckIn) {
    try {
      await deleteCheckIn.mutateAsync(ci.id);
      setPendingDeleteId(null);
      toast.success("已删除这条打卡记录");
    } catch {
      // error handled in useDeleteCheckIn
    }
  }

  return (
    <ModalOverlay open={open} onOpenChange={onOpenChange}>
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[1.3rem] font-bold text-gray-900 leading-tight">
            {dateLabel} 打卡明细
          </h2>
          <div className="shrink-0 rounded-2xl border border-[var(--color-line-soft)] bg-white/88 px-3 py-2 text-right shadow-[0_8px_20px_rgb(26_22_17/0.08)]">
            <div className="text-lg font-bold leading-none text-[var(--color-ink-900)]">
              {orderedCheckIns.length}
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-[var(--color-ink-500)]">
              总次数
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1 font-semibold text-brand-700">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            共 {orderedCheckIns.length} 次
          </span>
          {backdatedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
              补卡 {backdatedCount} 次
            </span>
          )}
        </div>
      </div>

      {orderedCheckIns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white/85 text-stone-400">
            <NotebookPen className="h-6 w-6" />
          </div>
          <div className="text-base font-semibold text-[var(--color-ink-700)]">
            这一天还没有打卡记录
          </div>
          <p className="mt-1 text-sm font-medium text-[var(--color-ink-500)]">
            可以在首页或统计页点击图表，快速查看每日明细
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pb-2">
          {orderedCheckIns.map((ci) => {
            const habit = habitsMap[ci.habit_id];
            const isBackdated =
              formatDate(ci.checked_at) !== formatDate(ci.created_at);
            const isEditing = editingId === ci.id;
            const isConfirmingDelete = pendingDeleteId === ci.id;

            return (
              <article
                key={ci.id}
                className="rounded-2xl border border-stone-200/80 bg-white/90 p-3.5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ backgroundColor: (habit?.color ?? "#d6d3d1") + "24" }}
                  >
                    <HabitIcon icon={habit?.icon} className="w-4 h-4" color={habit?.color ?? '#a8a29e'} fallback="📌" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-bold text-[var(--color-ink-900)]">
                        {habit?.name ?? "未知项目"}
                      </div>
                      {isBackdated && (
                        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          补卡
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          placeholder="记录一下这次的感受、数据或备注…"
                          rows={2}
                          autoFocus
                          aria-label="打卡备注"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => void saveNote(ci)}
                            isLoading={updateCheckIn.isPending}
                            loadingText="保存中…"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                            保存
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={cancelEditing}>
                            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "mt-1 text-xs leading-relaxed",
                          ci.note
                            ? "text-[var(--color-ink-600)]"
                            : "italic text-stone-400",
                        )}
                      >
                        {ci.note || "未填写备注"}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-stone-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatTime(ci.checked_at)}</span>
                      <span className="text-stone-300">&middot;</span>
                      <span>记录于 {formatTime(ci.created_at)}</span>
                    </div>

                    {!isEditing && (
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 transition-colors hover:text-brand-600"
                          onClick={() => startEditing(ci)}
                        >
                          <Pencil className="w-3 h-3" />
                          {ci.note ? "编辑备注" : "添加备注"}
                        </button>

                        {isConfirmingDelete ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                              onClick={() => void removeCheckIn(ci)}
                              disabled={deleteCheckIn.isPending}
                            >
                              {deleteCheckIn.isPending ? "删除中…" : "确认删除"}
                            </button>
                            <button
                              type="button"
                              className="text-[11px] font-medium text-stone-400 hover:text-stone-600"
                              onClick={() => setPendingDeleteId(null)}
                            >
                              取消
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 transition-colors hover:text-rose-600"
                            onClick={() => setPendingDeleteId(ci.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ModalOverlay>
  );
}
