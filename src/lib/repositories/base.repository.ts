import { PrismaClient } from '@prisma/client';

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(where?: object): Promise<T[]>;
  create(data: object): Promise<T>;
  update(id: string, data: object): Promise<T>;
  delete(id: string): Promise<T>;
}

export abstract class BaseRepository<T> implements IRepository<T> {
  constructor(
    protected prisma: PrismaClient,
    protected model: keyof PrismaClient,
  ) {}

  async findById(id: string): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = this.prisma[this.model] as any;
    return delegate.findUnique({ where: { id } });
  }

  async findMany(where?: object): Promise<T[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = this.prisma[this.model] as any;
    return delegate.findMany({ where });
  }

  async create(data: object): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = this.prisma[this.model] as any;
    return delegate.create({ data });
  }

  async update(id: string, data: object): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = this.prisma[this.model] as any;
    return delegate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = this.prisma[this.model] as any;
    return delegate.delete({ where: { id } });
  }
}
