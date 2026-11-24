import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const getCriteria = async (req: Request, res: Response) => {
  try {
    const criteria = await prisma.evaluationCriteria.findMany();
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching criteria' });
  }
};

export const getScheduleEvaluations = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const evaluations = await prisma.evaluation.findMany({
      where: { scheduleId },
      include: { criteria: true }
    });
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching evaluations' });
  }
};

// SUBMIT EVALUATION (SECURED)
export const submitEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { scores, comments } = req.body; 
    const user = req.user;

    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // 1. Find the panelist profile of the currently logged-in user
    const panelistProfile = await prisma.panelist.findUnique({
      where: { userId: user.userId }
    });

    if (!panelistProfile) {
      return res.status(403).json({ message: 'Only assigned panelists can submit evaluations.' });
    }

    const panelistId = panelistProfile.id;

    if (!scores || !Array.isArray(scores)) {
      return res.status(400).json({ message: 'Scores array is required' });
    }

    // 2. Delete old scores from this panelist for this schedule (allows re-grading)
    await prisma.evaluation.deleteMany({ where: { scheduleId, panelistId } });

    // 3. Save new scores
    const evaluationsData = scores.map((s: any) => ({
      scheduleId,
      panelistId,
      criteriaId: s.criteriaId,
      score: s.score,
      comments: comments || null
    }));

    await prisma.evaluation.createMany({ data: evaluationsData });
    res.status(201).json({ message: 'Evaluation submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting evaluation' });
  }
};

export const getConsolidatedResults = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const evaluations = await prisma.evaluation.findMany({
      where: { scheduleId },
      include: { criteria: true }
    });

    if (evaluations.length === 0) {
      return res.status(404).json({ message: 'No evaluations submitted for this schedule yet.' });
    }

    const panelistResults: Record<string, { totalScore: number; comments: string | null }> = {};
    
    evaluations.forEach(e => {
      if (!panelistResults[e.panelistId]) {
        panelistResults[e.panelistId] = { totalScore: 0, comments: e.comments };
      }
      panelistResults[e.panelistId].totalScore += (e.score * e.criteria.weight);
    });

    const formattedResults = [];
    let overallTotal = 0;

    for (const [panelistId, data] of Object.entries(panelistResults)) {
      const panelistProfile = await prisma.panelist.findUnique({
        where: { id: panelistId },
        include: { user: true }
      });
      
      formattedResults.push({
        panelistId,
        name: panelistProfile ? `${panelistProfile.user.firstName} ${panelistProfile.user.lastName}` : 'Unknown Panelist',
        score: Number(data.totalScore.toFixed(2)),
        comments: data.comments
      });
      overallTotal += data.totalScore;
    }

    const finalAverage = overallTotal / formattedResults.length;

    res.json({
      panelists: formattedResults,
      finalAverage: Number(finalAverage.toFixed(2)),
      status: finalAverage >= 75 ? 'PASSED' : 'FAILED'
    });

  } catch (error) {
    res.status(500).json({ message: 'Error calculating results' });
  }
};