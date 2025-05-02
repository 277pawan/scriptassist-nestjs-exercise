// tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Task } from '@modules/tasks/entities/task.entity';
import { TasksService } from '@modules/tasks/tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    BullModule.registerQueue({ name: 'task-processing' }), // 👈 REQUIRED HERE
  ],
  providers: [TasksService],
  exports: [TypeOrmModule, TasksService],
})
export class ScheduledTasksModule {}
