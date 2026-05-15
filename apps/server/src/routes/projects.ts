import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type {
  SaveProjectPayload,
  UpdateProjectPayload,
  ProjectResponse,
  SceneNode,
} from '@aether/types';

const router = Router();
const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function toResponse(project: {
  id: string; name: string; nodes: unknown;
  thumbnailUrl: string | null; userId: string | null;
  createdAt: Date; updatedAt: Date;
}): ProjectResponse {
  return {
    id:           project.id,
    name:         project.name,
    nodes:        project.nodes as SceneNode[],
    thumbnailUrl: project.thumbnailUrl,
    userId:       project.userId,
    createdAt:    project.createdAt.toISOString(),
    updatedAt:    project.updatedAt.toISOString(),
  };
}

function isPrismaNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 'P2025'
  );
}

// ── POST /api/projects ────────────────────────────────────────────────────────

router.post('/projects', async (req: Request, res: Response) => {
  const { name, nodes, user } = req.body as SaveProjectPayload;

  if (!name || !Array.isArray(nodes)) {
    res.status(400).json({ error: 'name (string) and nodes (array) are required' });
    return;
  }

  try {
    let userId: string | undefined;

    if (user?.email) {
      const dbUser = await prisma.user.upsert({
        where:  { email: user.email },
        create: { email: user.email, name: user.name, image: user.image },
        update: { name: user.name, image: user.image },
      });
      userId = dbUser.id;
    }

    const project = await prisma.project.create({
      data: { name, nodes: nodes as unknown as never, userId },
    });
    res.status(201).json(toResponse(project));
  } catch (err) {
    console.error('[POST /projects]', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ── GET /api/projects ─────────────────────────────────────────────────────────

router.get('/projects', async (req: Request, res: Response) => {
  const { userEmail } = req.query;

  try {
    if (userEmail && typeof userEmail === 'string') {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!user) {
        res.json([]);
        return;
      }
      const projects = await prisma.project.findMany({
        where:   { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(projects.map(toResponse));
      return;
    }

    res.status(400).json({ error: 'userEmail query param is required' });
  } catch (err) {
    console.error('[GET /projects]', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ── GET /api/projects/:id ─────────────────────────────────────────────────────

router.get('/projects/:id', async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(toResponse(project));
  } catch (err) {
    console.error('[GET /projects/:id]', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ── PUT /api/projects/:id ─────────────────────────────────────────────────────

router.put('/projects/:id', async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { nodes } = req.body as UpdateProjectPayload;

  if (!Array.isArray(nodes)) {
    res.status(400).json({ error: 'nodes (array) is required' });
    return;
  }

  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data:  { nodes: nodes as unknown as never },
    });
    res.json(toResponse(project));
  } catch (err) {
    if (isPrismaNotFound(err)) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    console.error('[PUT /projects/:id]', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

export default router;
