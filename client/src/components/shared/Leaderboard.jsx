import { AnimatePresence, motion } from "framer-motion";

export default function Leaderboard({ items }) {
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {items.map((player, idx) => (
          <motion.div
            key={player.nickname}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center justify-between rounded-2xl border border-base-200 bg-white/80 px-4 py-3 shadow-paper"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-display text-base-800">#{idx + 1}</span>
              <span className="text-base font-semibold text-base-800">{player.nickname}</span>
            </div>
            <span className="text-base-800/70">{player.score}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
