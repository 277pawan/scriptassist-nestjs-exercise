import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskFilterDto } from './dto/task-filter.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private readonly dataSource: DataSource,
    @InjectQueue('task-processing')
    private taskQueue: Queue, // Injected BullMQ queue
  ) {}

  // Create a new task and enqueue a job
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const savedTask = await this.dataSource.transaction(async manager => {
      const task = manager.create(Task, createTaskDto);
      return await manager.save(task);
    });

    try {
      // Enqueue task status update job
      await this.taskQueue.add('task-status-update', {
        taskId: savedTask.id,
        status: savedTask.status,
      });
    } catch (error) {
      // Log queue error but don’t block task creation
      console.error('Failed to enqueue task-status-update:', error);
    }

    return savedTask;
  }

  // Get all tasks with optional filters and pagination
  async findAll(filterDto: TaskFilterDto): Promise<Task[]> {
    const { status, priority, userId, search, page = 1, limit = 10 } = filterDto;

    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user');

    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });
    if (userId) query.andWhere('task.userId = :userId', { userId });
    if (search) {
      query.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    query.skip((page - 1) * limit).take(limit);

    return await query.getMany();
  }

  // Get a single task by ID
  async findOne(id: string): Promise<Task> {
    try {
      const taskData = await this.tasksRepository.findOne({
        where: { id },
        relations: ['user'], // Include user details if needed
      });

      if (!taskData) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return taskData;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      console.error('Database Error:', error);
      throw new InternalServerErrorException('An error occurred while fetching the task');
    }
  }

  // Update task with pessimistic locking and conditional queue enqueue
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Partial<Task>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await queryRunner.manager.findOne(Task, {
        where: { id },
        lock: { mode: 'pessimistic_write' }, // Lock row to prevent race condition
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      const originalStatus = task.status;

      // Merge changes into existing entity
      const updated = queryRunner.manager.merge(Task, task, updateTaskDto as Partial<Task>);
      const savedTask = await queryRunner.manager.save(updated);

      // Enqueue status update only if status changed
      if (originalStatus !== savedTask.status) {
        await this.taskQueue.add('task-status-update', {
          taskId: savedTask.id,
          status: savedTask.status,
        });
      }

      await queryRunner.commitTransaction();
      return savedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) throw error;

      console.error('Update failed:', error);
      throw new InternalServerErrorException('Failed to update task');
    } finally {
      await queryRunner.release(); // Ensure cleanup
    }
  }

  // Delete task by ID
  async remove(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  // Get tasks by status (e.g., for background workers or dashboards)
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { status },
      relations: ['user'], // Optional: include user details
    });
  }

  // Update task status safely with validation
  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    // Validate status before proceeding
    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const task = await this.tasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    task.status = status;
    return await this.tasksRepository.save(task);
  }
}
