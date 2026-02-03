import { Router } from "express";
import { getSession } from "../services/sessionService.js";

const router = Router();

router.get("/:code/export", (req, res) => {
  const session = getSession(req.params.code);
  if (!session || !session.results) {
    return res.status(404).send("Results not available");
  }
  const rows = session.results.stats;
  const header = "nickname,score,accuracy,avgResponseTime";
  const csv = [header]
    .concat(
      rows.map(
        (r) =>
          `${JSON.stringify(r.nickname)},${r.score},${r.accuracy},${r.avgResponseTime}`
      )
    )
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=quizrush-${session.code}.csv`);
  res.send(csv);
});

export default router;
