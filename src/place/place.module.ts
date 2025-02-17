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
import { CartModule } from 'src/cart/cart.module';
import { authOptionMiddleware } from 'src/auth/auth-option.middleware';
import { Cart } from 'src/cart/entities/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Place, Region, PlaceRating, Cart]),
    HttpModule,
    AuthModule,
    GptModule,
    CartModule,
  ],
  controllers: [PlaceController],
  providers: [PlaceService],
})
export class PlaceModule {
  configure(middleware: MiddlewareConsumer) {
    middleware
      .apply(authMiddleware)
      .forRoutes(
        { path: 'places/:id/rating', method: RequestMethod.POST },
        { path: 'places/:id/rating', method: RequestMethod.DELETE },
        { path: 'places/recommendations', method: RequestMethod.GET },
      );

    middleware
      .apply(authOptionMiddleware)
      .forRoutes({ path: 'places/:id', method: RequestMethod.GET });
  }
}
