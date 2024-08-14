import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelRoute } from './entities/travelroute.entity';
import { DetailTravel } from './entities/detailtravel.entity';
import { CreateTravelRouteDto } from './dto/create-travelroute.dto';
import { CreateDetailTravelItemDto, UpdateDetailTravelDto } from './dto/update-detailtravel.dto';
import { User } from 'src/user/entities/user.entity';
import { Place } from 'src/place/entities/place.entity';
import { Region } from 'src/place/entities/region.entity';
import { Post } from 'src/post/entities/post.entity';
import { Fork } from './entities/fork.entity';


@Injectable()
export class TravelRouteService {
  constructor(
    @InjectRepository(TravelRoute)
    private travelRouteRepository: Repository<TravelRoute>,
    @InjectRepository(DetailTravel)
    private detailTravelRepository: Repository<DetailTravel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(Region)
    private regionRepository: Repository<Region>,
    @InjectRepository(Fork)
    private forkRepository: Repository<Fork>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createTravelRoute(userId: number, createTravelRouteDto: CreateTravelRouteDto): Promise<TravelRoute> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const travelRoute = this.travelRouteRepository.create({
      ...createTravelRouteDto,
      user: { id: userId },
    });
    return this.travelRouteRepository.save(travelRoute);
  }

  async addDetailToTravelRoute(travelRouteId: number, updateDetailTravelDto: UpdateDetailTravelDto): Promise<DetailTravel[]> {
    const travelRoute = await this.travelRouteRepository.findOne({ where: { id: travelRouteId } });
    
    if (!travelRoute) {
      throw new NotFoundException('여행 경로를 찾을 수 없습니다.');
    }
  
    const detailsToSave: DetailTravel[] = [];
  
    for (const item of updateDetailTravelDto.items) {
      for (const detail of item.details) {
        const newDetailTravel = new DetailTravel();
        newDetailTravel.travelRoute = travelRoute;
        newDetailTravel.date = new Date(item.date);
        newDetailTravel.place_id = detail.place_id;
        newDetailTravel.routeIndex = detail.routeIndex;
        newDetailTravel.contents = detail.contents;
        newDetailTravel.region_id = detail.region_id;
        newDetailTravel.address = detail.address;
        newDetailTravel.placeTitle = detail.place_title;
        newDetailTravel.placeImage = detail.place_image;
        newDetailTravel.mapLink = detail.map_link;
        newDetailTravel.transportOption = updateDetailTravelDto.transport_option;  // 추가된 transport_option 필드
  
        detailsToSave.push(newDetailTravel);
      }
    }
  
    // 일괄 저장
    return await this.detailTravelRepository.save(detailsToSave);
  }
  
 // TravelRoute 수정
 async updateTravelRoute(travelrouteId: number, updateTravelRouteDto: { 
  travel_name?: string, travelroute_range?: number, start_date?: Date, end_date?: Date }): Promise<any> {

  const travelRoute = await this.travelRouteRepository.findOne({ where: { id: travelrouteId } });
  if (!travelRoute) {
      throw new NotFoundException('여행 경로를 찾을 수 없습니다.');
  }

  travelRoute.travel_name = updateTravelRouteDto.travel_name || travelRoute.travel_name;
  travelRoute.travelroute_range = updateTravelRouteDto.travelroute_range || travelRoute.travelroute_range;
  travelRoute.start_date = updateTravelRouteDto.start_date || travelRoute.start_date;
  travelRoute.end_date = updateTravelRouteDto.end_date || travelRoute.end_date;

  return this.travelRouteRepository.save(travelRoute);
}

// DetailTravel 수정
async updateDetailTravel(detailtravelId: number, updateDetailTravelDto: UpdateDetailTravelDto): Promise<any> {
  // 세부 여행 정보를 조회합니다.
  const detailTravel = await this.detailTravelRepository.findOne({ where: { id: detailtravelId } });
  if (!detailTravel) {
    throw new NotFoundException('세부 여행 정보를 찾을 수 없습니다.');
  }

  // DTO에 있는 항목을 detailTravel 엔티티에 업데이트합니다.
  detailTravel.routeIndex = updateDetailTravelDto.items[0].details[0].routeIndex || detailTravel.routeIndex;
  detailTravel.contents = updateDetailTravelDto.items[0].details[0].contents || detailTravel.contents;
  detailTravel.region_id = updateDetailTravelDto.items[0].details[0].region_id || detailTravel.region_id;
  detailTravel.address = updateDetailTravelDto.items[0].details[0].address || detailTravel.address;
  detailTravel.placeTitle = updateDetailTravelDto.items[0].details[0].place_title || detailTravel.placeTitle;
  detailTravel.placeImage = updateDetailTravelDto.items[0].details[0].place_image || detailTravel.placeImage;
  detailTravel.mapLink = updateDetailTravelDto.items[0].details[0].map_link || detailTravel.mapLink;
  detailTravel.transportOption = updateDetailTravelDto.transport_option || detailTravel.transportOption;

  // 날짜와 관련된 필드 업데이트
  detailTravel.date = updateDetailTravelDto.items[0].date ? new Date(updateDetailTravelDto.items[0].date) : detailTravel.date;

  // 업데이트된 세부 정보를 저장합니다.
  return this.detailTravelRepository.save(detailTravel);
}


// TravelRoute 조회
async getTravelRoute(userId: number): Promise<any> {
  const travelRoutes = await this.travelRouteRepository.find({ where: { user_id: userId }});
  if (!travelRoutes || travelRoutes.length === 0) {
      throw new NotFoundException('해당 사용자의 여행 경로를 찾을 수 없습니다.');
  }
  return travelRoutes;
}


// DetailTravel 조회
async getDetailTravel(travelrouteId: number): Promise<any> {
  const travelRoute = await this.travelRouteRepository.findOne({ where: { id: travelrouteId } });
  
  if (!travelRoute) {
    throw new NotFoundException('여행 경로를 찾을 수 없습니다.');
  }

  const detailTravels = await this.detailTravelRepository.find({
    where: { travelRoute: { id: travelrouteId } },
  });

  // 날짜별로 그룹화
  const groupedByDate = detailTravels.reduce((acc, detail) => {
    const dateKey = detail.date.toISOString().split('T')[0]; // 날짜만 사용 (YYYY-MM-DD)
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(detail);
    return acc;
  }, {} as Record<string, DetailTravel[]>);

  // 원하는 형식으로 변환
  const result = Object.keys(groupedByDate).map(date => ({
    date,
    details: groupedByDate[date]
  }));

  return { items: result };
}



// TravelRoute 삭제
async deleteTravelRoute(travelrouteId: number): Promise<void> {
  const travelRoute = await this.travelRouteRepository.findOne({ where: { id: travelrouteId } });
  if (!travelRoute) {
      throw new NotFoundException('여행 경로를 찾을 수 없습니다.');
  }
  await this.travelRouteRepository.remove(travelRoute);
  
}

// DetailTravel 삭제
async deleteDetailTravel(detailtravelId: number): Promise<void> {
  const detailTravel = await this.detailTravelRepository.findOne({ where: { id: detailtravelId} });
  if (!detailTravel) {
      throw new NotFoundException('세부 여행 정보를 찾을 수 없습니다.');
  }
  await this.detailTravelRepository.remove(detailTravel);
}

async forkPost(userId: number, postId: number): Promise<Fork> {
  const post = await this.postRepository.findOne({ where: { id: postId }, relations: ['travelRoute'] });
  if (!post) {
    throw new NotFoundException('게시글을 찾을 수 없습니다.');
  }

  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('사용자를 찾을 수 없습니다.');
  }

  const existingFork = await this.forkRepository.findOne({ where: { user: { id: userId }, post: { id: postId } } });
  if (existingFork) {
    throw new ConflictException('이미 포크한 게시글입니다.');
  }

  const travelRoute = post.travelRoute;
  if (!travelRoute) {
    throw new NotFoundException('여행 경로를 찾을 수 없습니다.');
  }

  // 포크 데이터 생성
  const fork = this.forkRepository.create({ 
    user_id: userId, 
    post_id: postId,
    forked_at: new Date(), 
  });

  await this.forkRepository.save(fork);

  // 새로운 TravelRoute 데이터 생성
  const newTravelRoute = this.travelRouteRepository.create({
    user_id: userId,
    travel_name: travelRoute.travel_name,
    travelroute_range: travelRoute.travelroute_range,
  });

  const savedTravelRoute = await this.travelRouteRepository.save(newTravelRoute);

  // 원래 travelRoute에 연결된 detailtravel 데이터 가져오기
  const detailTravels = await this.detailTravelRepository.find({ where: { travelroute_id: travelRoute.id } });

  // 새 travelRoute에 맞게 detailtravel 데이터 복제
  for (const detailTravel of detailTravels) {
    const newDetailTravel = this.detailTravelRepository.create({
      travelroute_id: savedTravelRoute.id,  // 새로운 travelroute_id
      place_id: detailTravel.place_id,
      routeIndex: detailTravel.routeIndex,  // 'count'를 'routeIndex'로 수정
      region_id: detailTravel.region_id,
      date: detailTravel.date,
      playTime: detailTravel.playTime,  // 'time'을 'playTime'으로 수정
      contents: detailTravel.contents,
      transportOption: detailTravel.transportOption,  // 'traffic_info'를 'transportOption'으로 수정
      starting_point: detailTravel.starting_point,
      detailtravel_image: detailTravel.detailtravel_image,
      address: detailTravel.address,
      placeTitle: detailTravel.placeTitle,
      placeImage: detailTravel.placeImage,
      day: detailTravel.day,
      mapLink: detailTravel.mapLink,
    });

      await this.detailTravelRepository.save(newDetailTravel);
  }

  return fork;
}

  // 추천 경로를 기준으로 커스텀
  async saveRecommendedRoute(
    createTravelRouteDto: CreateTravelRouteDto,
    userId: number,
  ): Promise<any> {
    try {
      const { travel_name, travelroute_range, transportOption, detailRoute } = createTravelRouteDto;
  
      // 새로운 TravelRoute 생성
      const newTravelRoute = this.travelRouteRepository.create({
        user_id: userId,
        travel_name,
        travelroute_range,
      });
  
      // TravelRoute 저장
      const savedTravelRoute = await this.travelRouteRepository.save(newTravelRoute);
      
      // DetailTravel 데이터 저장
      const detailTravelEntities = await Promise.all(detailRoute.map(async detail => {
        try {
          const place = await this.placeRepository.findOne({
            where: {
              address: detail.address,
              title: detail.placeTitle,
            },
          });
          
          if (!place) {
            throw new NotFoundException(`Place not found for address: ${detail.address}, title: ${detail.placeTitle}`);
          }
  
          const detailTravel = this.detailTravelRepository.create({
            travelroute_id: savedTravelRoute.id,
            place_id: place.id,
            routeIndex: detail.routeIndex,
            region_id: place.regionId,
            date: new Date(detail.date),
            playTime: detail.playTime,
            contents: null,
            transportOption: transportOption,
            detailtravel_image: detail.placeImage,
            address: detail.address,
            placeTitle: detail.placeTitle,
            placeImage: detail.placeImage,
            day: detail.day,
            mapLink: detail.mapLink,
          });
  
          return detailTravel;
        } catch (error) {
          console.error('Error while creating DetailTravel:', error);
          throw error;  // 다시 던져서 외부에서 처리할 수 있게 함
        }
      }));
      return savedTravelRoute;
    } catch (error) {
      console.error('Error in saveRecommendedRoute:', error);
      throw error;  // 최종적으로 외부에서 처리
    }
  }


}
