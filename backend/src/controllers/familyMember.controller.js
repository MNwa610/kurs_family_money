import { prisma } from '../lib/prisma.js';
import { getFamilyMemberForUser } from '../lib/ownership.js';
import { optionalString, requireString } from '../utils/validation.js';

export async function list(req, res) {
  const members = await prisma.familyMember.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      relation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json({ data: members });
}

export async function getOne(req, res) {
  const member = await getFamilyMemberForUser(req.user.id, req.params.id);
  res.json({
    id: member.id,
    name: member.name,
    relation: member.relation,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  });
}

export async function create(req, res) {
  const name = requireString(req.body?.name, 'name');
  const relation = optionalString(req.body?.relation);

  const member = await prisma.familyMember.create({
    data: {
      userId: req.user.id,
      name,
      relation,
    },
    select: {
      id: true,
      name: true,
      relation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.status(201).json(member);
}

export async function update(req, res) {
  await getFamilyMemberForUser(req.user.id, req.params.id);
  const name = req.body?.name != null ? requireString(req.body.name, 'name') : undefined;
  const relation = req.body?.relation !== undefined ? optionalString(req.body.relation) : undefined;

  const member = await prisma.familyMember.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(relation !== undefined && { relation }),
    },
    select: {
      id: true,
      name: true,
      relation: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(member);
}

export async function remove(req, res) {
  const member = await getFamilyMemberForUser(req.user.id, req.params.id);
  const opCount =
    (await prisma.income.count({ where: { familyMemberId: member.id } }))
    + (await prisma.expense.count({ where: { familyMemberId: member.id } }));
  if (opCount > 0) {
    return res.status(409).json({
      message: 'Нельзя удалить члена семьи с операциями. Сначала удалите или переназначите их.',
    });
  }
  await prisma.familyMember.delete({ where: { id: member.id } });
  res.status(204).send();
}
