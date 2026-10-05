import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import { Clinic } from '../../types/clinic/clinic';
import { ClinicsInquiry } from '../../types/clinic/clinic.input';
import ClinicSlideCard from './ClinicSlideCard';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CLINICS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_CLINIC } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TrendClinicsProps {
	initialInput: ClinicsInquiry;
}

const TrendClinics = (props: TrendClinicsProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [trendClinics, setTrendClinics] = useState<Clinic[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetClinic] = useMutation(LIKE_TARGET_CLINIC);

	const { refetch: getClinicsRefetch } = useQuery(GET_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTrendClinics(data?.getClinics?.list);
		},
	});

	/** HANDLERS **/

	const likeClinicHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetClinic({ variables: { input: id } });
			await getClinicsRefetch({ input: initialInput });

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeClinicHandler: ', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (!trendClinics) return null;

	if (device === 'mobile') {
		return (
			<Stack className={'trend-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Trend Clinics</span>
					</Stack>
					<Stack className={'card-box'}>
						{trendClinics.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>
								Trends Empty
							</Box>
						) : (
							<Swiper
								className={'trend-property-swiper'}
								slidesPerView={'auto'}
								centeredSlides={true}
								spaceBetween={15}
								modules={[Autoplay]}
							>
								{trendClinics.map((clinic: Clinic) => {
									return (
										<SwiperSlide key={clinic._id} className={'trend-property-slide'}>
											<ClinicSlideCard clinic={clinic} likeClinicHandler={likeClinicHandler} cardClass={'trend-card-box'} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'trend-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Trend Clinics</span>
							<p>Trend is based on likes</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-trend-prev'} />
								<div className={'swiper-trend-pagination'}></div>
								<EastIcon className={'swiper-trend-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						{trendClinics.length === 0 ? (
							<Box component={'div'} className={'empty-list'}>
								Trends Empty
							</Box>
						) : (
							<Swiper
								className={'trend-property-swiper'}
								slidesPerView={'auto'}
								spaceBetween={15}
								modules={[Autoplay, Navigation, Pagination]}
								navigation={{
									nextEl: '.swiper-trend-next',
									prevEl: '.swiper-trend-prev',
								}}
								pagination={{
									el: '.swiper-trend-pagination',
								}}
							>
								{trendClinics.map((clinic: Clinic) => {
									return (
										<SwiperSlide key={clinic._id} className={'trend-property-slide'}>
											<ClinicSlideCard clinic={clinic} likeClinicHandler={likeClinicHandler} cardClass={'trend-card-box'} />
										</SwiperSlide>
									);
								})}
							</Swiper>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TrendClinics.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'clinicLikes',
		direction: 'DESC',
		search: {},
	},
};

export default TrendClinics;
