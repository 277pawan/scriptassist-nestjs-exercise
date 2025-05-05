import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TasksService } from '../../modules/tasks/tasks.service';
import { Task } from '@modules/tasks/entities/task.entity';
import { TaskStatus } from '@modules/tasks/enums/task-status.enum';

@Injectable()
@Processor('task-processing')
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case 'task-status-update':
          return await this.handleStatusUpdate(job);
        case 'overdue-tasks-notification':
          return await this.handleOverdueTasks(job);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async handleStatusUpdate(job: Job) {
    const { taskId, status } = job.data;

    if (!taskId || typeof status !== 'string') {
      this.logger.warn(`Invalid data in job ${job.id}`);
      return { success: false, error: 'Invalid job data' };
    }

    try {
      const status: TaskStatus = TaskStatus.COMPLETED;
      const task = await this.tasksService.updateStatus(taskId, status);
      return { success: true, taskId: task.id, newStatus: task.status };
    } catch (err) {
      this.logger.error(`Failed to update task status: ${err}`);
      throw err;
    }
  }

  private async handleOverdueTasks(_job: Job) {
    this.logger.debug('Checking for overdue tasks...');

    try {
      const overdueTasks = await this.tasksService.getOverdueTasks();

      const results = await Promise.allSettled(
        overdueTasks.map((task: Task) => this.tasksService.notifyUserAboutOverdueTask(task.id)),
      );

      const failures = results.filter(
        (r: PromiseSettledResult<unknown>) => r.status === 'rejected',
      );
      if (failures.length) {
        this.logger.warn(`${failures.length} notifications failed`);
      }

      return {
        success: true,
        processed: overdueTasks.length,
        failed: failures.length,
      };
    } catch (err) {
      this.logger.error(`Overdue task processing failed: ${err}`);
      throw err;
    }
  }
}
