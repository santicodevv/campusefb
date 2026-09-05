import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Transcript } from './entities/transcript.entity';
import { User } from '../users/entities/user.entity';
import { LocalGrade } from '../academic/entities/local-grade.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';

// Services
import { TranscriptsService } from './services/transcripts.service';
import { TranscriptPdfService } from './services/transcript-pdf.service';

// Controller
import { TranscriptsController } from './transcripts.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Transcript, User, LocalGrade, AcademicPeriod]),
  ],
  controllers: [TranscriptsController],
  providers: [TranscriptsService, TranscriptPdfService],
  exports: [TranscriptsService],
})
export class TranscriptsModule {}
