import express from "express";

const router = express.Router();

router.post("/start", (req, res) => {
  // For REST-based start (if you want, otherwise only WS)
  res.json({ status: "ok" });
});

export default router;
