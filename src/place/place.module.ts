import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { PlaceService } from './place.service';
import { PlaceController } from './place.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { HttpModule } from '@nestjs/axios';
import { Region } from './entities/region.entity';
import { PlaceRating } from './entities/placeRating.entity';
import { authMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { GptModule } from 'src/gpt/gpt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Place, Region, PlaceRating]),
    HttpModule,
    AuthModule,
    GptModule,
  ],
  controllers: [PlaceController],
  providers: [PlaceService],
})
export class PlaceModule {
  configure(middleware: MiddlewareConsumer) {
    middleware
      .apply(authMiddleware)
      .exclude(
        { path: 'places', method: RequestMethod.GET },
        { path: 'places/:id', method: RequestMethod.GET },
        { path: 'places/asd/asd', method: RequestMethod.GET },
      )
      .forRoutes(PlaceController);
  }
}
