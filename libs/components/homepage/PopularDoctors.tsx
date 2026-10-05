import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import PopularDoctorCard from './PopularDoctorCard';
import { Doctor } from '../../types/doctor/doctor';
import Link from 'next/link';
import { DoctorsInquiry } from '../../types/doctor/doctor.input';
import { GET_DOCTORS } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';
import { T } from '../../types/common';

interface PopularDoctorsProps {
	initialInput: DoctorsInquiry;
}

const PopularDoctors = (props: PopularDoctorsProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [popularDoctors, setPopularDoctors] = useState<Doctor[]>([]);

	/** APOLLO REQUESTS **/
	useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setPopularDoctors(data?.getDoctors?.list);
		},
	});

	if (!popularDoctors) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'popular-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Popular Doctors</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-property-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={25}
							modules={[Autoplay]}
						>
							{popularDoctors.map((doctor: Doctor) => {
								return (
									<SwiperSlide key={doctor._id} className={'popular-property-slide'}>
										<PopularDoctorCard doctor={doctor} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'popular-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Popular Doctors</span>
							<p>Popularity is based on views</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'more-box'}>
								<Link href={'/doctor'}>
									<span>See All Doctors</span>
								</Link>
								<img src="/img/icons/rightup.svg" alt="" />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'popular-property-swiper'}
							slidesPerView={'auto'}
							spaceBetween={25}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-popular-next',
								prevEl: '.swiper-popular-prev',
							}}
							pagination={{
								el: '.swiper-popular-pagination',
							}}
						>
							{popularDoctors.map((doctor: Doctor) => {
								return (
									<SwiperSlide key={doctor._id} className={'popular-property-slide'}>
										<PopularDoctorCard doctor={doctor} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
					<Stack className={'pagination-box'}>
						<WestIcon className={'swiper-popular-prev'} />
						<div className={'swiper-popular-pagination'}></div>
						<EastIcon className={'swiper-popular-next'} />
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

PopularDoctors.defaultProps = {
	initialInput: {
		page: 1,
		limit: 7,
		sort: 'doctorViews',
		direction: 'DESC',
		search: {},
	},
};

export default PopularDoctors;
