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
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-display text-white">#{idx + 1}</span>
              <span className="text-base font-semibold text-white">{player.nickname}</span>
            </div>
            <span className="text-white/60">{player.score}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
