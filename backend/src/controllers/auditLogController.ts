import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET ALL AUDIT LOGS
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};