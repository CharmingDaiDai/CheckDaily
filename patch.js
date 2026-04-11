const fs = require('fs');
let code = fs.readFileSync('src/routes/index.tsx', 'utf8');

code = code.replace(
  /import \{ useHabits \} from "@\/hooks\/useHabits";/,
  "import { useHabits } from '@/hooks/useHabits';\nimport { useCombos } from '@/hooks/useCombos';"
);

code = code.replace(
  /import \{ useTodayCheckIns, useCheckIns \} from "@\/hooks\/useCheckIns";/,
  "import { useTodayCheckIns, useCheckIns, useCheckInCombo } from '@/hooks/useCheckIns';"
);

if (!code.includes('useCheckInCombo()')) {
  code = code.replace(
    /const \{\s*data: habits,[^\}]*refetch: refetchHabits,?\s*\} = useHabits\(\);/s,
    "const { data: habits, isLoading: habitsLoading, isFetching: habitsFetching, error: habitsError, refetch: refetchHabits } = useHabits();\n  const { data: combos, isLoading: combosLoading } = useCombos();\n  const checkInCombo = useCheckInCombo();"
  );
}

code = code.replace(
  /const isLoading = habitsLoading \|\| todayLoading;/g,
  "const isLoading = habitsLoading || todayLoading || combosLoading;"
);

if (!code.includes('renderedCombos')) {
  code = code.replace(
    /\/\/ Sort: incomplete first, completed at bottom/g,
    `// Combos status
  const renderedCombos = useMemo(() => {
    if (!combos || !habits) return [];
    return combos.map(combo => {
      const isDone = combo.habit_ids.length > 0 && combo.habit_ids.every(id => (todayCountMap[id] ?? 0) > 0);
      return { ...combo, isDone };
    }).sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1));
  }, [combos, habits, todayCountMap]);

  // Sort: incomplete first, completed at bottom`
  );
}

const comboGridCode = `{/* Combos grid */}
      {!isLoading && renderedCombos.length > 0 && (
        <motion.div variants={sectionReveal} className="space-y-3 mb-8">
          <div className="text-sm font-bold text-stone-500 px-1 border-b border-stone-100 pb-2">运动组合</div>
          <div className={gridClass}>
            {renderedCombos.map(combo => (
              <button
                key={combo.id}
                disabled={combo.isDone || checkInCombo.isPending || combo.habit_ids.length === 0}
                onClick={() => checkInCombo.mutate({ habitIds: combo.habit_ids })}
                className={\`flex flex-col items-center justify-center gap-2 p-3 rounded-[var(--radius-card-lg)] border-2 transition-all tap-scale \${combo.isDone ? 'opacity-60 bg-stone-50 border-stone-200 grayscale cursor-not-allowed' : 'bg-white border-transparent shadow-sm hover:shadow-md'}\`}
                style={!combo.isDone ? { borderColor: combo.color + '40' } : undefined}
              >
                <div 
                  className="w-11 h-11 rounded-[0.85rem] flex items-center justify-center text-2xl shrink-0 transition-transform" 
                  style={{ backgroundColor: combo.color + (combo.isDone ? '05' : '18') }}
                >
                  {combo.icon || '🚀'}
                </div>
                <div className="font-bold text-[13px] text-stone-800 text-center truncate w-full">{combo.name}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Habit grid */}`;

if (!code.includes('{/* Combos grid */}')) {
  code = code.replace(
    /\{\/\* Habit grid \*\/\}/g,
    comboGridCode
  );
}

fs.writeFileSync('src/routes/index.tsx', code);
