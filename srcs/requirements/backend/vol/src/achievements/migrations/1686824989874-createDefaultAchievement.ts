import { MigrationInterface, QueryRunner } from "typeorm"
import { Achievement } from '../entities/achievement.entity';
import { DEFAULT_ACHIEVEMENTS } from '../achievements';

export class CreateDefaultAchievement1686824989874 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const achievementData of DEFAULT_ACHIEVEMENTS) {
      const achievement = queryRunner.manager.create(Achievement, achievementData);
      await queryRunner.manager.save(achievement);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
