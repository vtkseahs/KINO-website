import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(movieId: number, userId?: number) {
    const posts = await this.prisma.discussionPost.findMany({
      where: { movieId },
      include: { user: { select: { name: true } }, likes: { select: { userId: true } } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const nodes = new Map(posts.map(post => [post.id, {
      ...post,
      dateLabel: new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Moscow' }).format(post.createdAt),
      likeCount: post.likes.length,
      liked: post.likes.some(like => like.userId === userId),
      initial: Array.from(post.user.name.trim())[0]?.toUpperCase() || 'К',
      replyTo: '',
      replies: [] as Array<any>,
    }]));
    const roots: Array<any> = [];
    for (const node of nodes.values()) {
      if (!node.parentId || !nodes.has(node.parentId)) { roots.push(node); continue; }
      const directParent = nodes.get(node.parentId)!;
      node.replyTo = directParent.user.name;
      let root = directParent;
      while (root.parentId && nodes.has(root.parentId)) root = nodes.get(root.parentId)!;
      root.replies.push(node);
    }
    return { threads: roots.reverse(), count: posts.length };
  }

  async create(movieId: number, userId: number, content: unknown, rawParentId?: unknown) {
    if (typeof content !== 'string' || !content.trim() || content.trim().length > 5000) {
      throw new BadRequestException('Введите сообщение длиной от 1 до 5000 символов');
    }
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
    if (!movie) throw new NotFoundException('Фильм не найден');
    const parentId = rawParentId === undefined || rawParentId === '' ? null : Number(rawParentId);
    if (parentId !== null) {
      if (!Number.isSafeInteger(parentId) || parentId < 1) throw new BadRequestException('Некорректный ответ');
      const parent = await this.prisma.discussionPost.findUnique({ where: { id: parentId }, select: { movieId: true } });
      if (!parent || parent.movieId !== movieId) throw new BadRequestException('Сообщение для ответа не найдено в этом обсуждении');
    }
    return this.prisma.discussionPost.create({ data: { movieId, userId, parentId, content: content.trim() } });
  }

  async toggleLike(movieId: number, postId: number, userId: number) {
    const post = await this.prisma.discussionPost.findUnique({ where: { id: postId }, select: { movieId: true } });
    if (!post || post.movieId !== movieId) throw new NotFoundException('Сообщение не найдено');
    const removed = await this.prisma.discussionLike.deleteMany({ where: { postId, userId } });
    if (!removed.count) await this.prisma.discussionLike.upsert({ where: { userId_postId: { userId, postId } }, create: { userId, postId }, update: {} });
  }
}
