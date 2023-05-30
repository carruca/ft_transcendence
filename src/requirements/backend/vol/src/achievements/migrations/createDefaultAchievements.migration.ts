import { MigrationInterface, QueryRunner } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';

export class CreateDefaultAchievements1621900000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		const defaultAchievements: Partial<Achievement>[] = [
			{
				name: 'Logro 1',
				description: 'Este es el logro 1',
				image: 'ruta-imagen-logro1',
			},
			{
				name: 'Logro 2',
				description: 'Este es el logro 2',
				image: 'ruta-imagen-logro2',
			},
		];

		for (const achievementData of defaultAchievements) {
			const achievement = queryRunner.manager.create(Achievement, achievementData);
			
			await queryRunner.manager.save(achievement);
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {}
}
