import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import ClinicSlideCard from './ClinicSlideCard';
import { ClinicsInquiry } from '../../types/clinic/clinic.input';
import { Clinic } from '../../types/clinic/clinic';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CLINICS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { LIKE_TARGET_CLINIC } from '../../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

interface TopClinicsProps {
	initialInput: ClinicsInquiry;
}

const TopClinics = (props: TopClinicsProps) => {
	const { initialInput } = props;
	const device = useDeviceDetect();
	const [topClinics, setTopClinics] = useState<Clinic[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetClinic] = useMutation(LIKE_TARGET_CLINIC);

	const { refetch: getClinicsRefetch } = useQuery(GET_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialInput },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setTopClinics(data?.getClinics?.list);
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

	if (device === 'mobile') {
		return (
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<span>Top Clinics</span>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							centeredSlides={true}
							spaceBetween={15}
							modules={[Autoplay]}
						>
							{topClinics.map((clinic: Clinic) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={clinic?._id}>
										<ClinicSlideCard clinic={clinic} likeClinicHandler={likeClinicHandler} cardClass={'top-card-box'} />
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
			<Stack className={'top-properties'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span>Top Clinics</span>
							<p>Check out our top rated clinics</p>
						</Box>
						<Box component={'div'} className={'right'}>
							<div className={'pagination-box'}>
								<WestIcon className={'swiper-top-prev'} />
								<div className={'swiper-top-pagination'}></div>
								<EastIcon className={'swiper-top-next'} />
							</div>
						</Box>
					</Stack>
					<Stack className={'card-box'}>
						<Swiper
							className={'top-property-swiper'}
							slidesPerView={'auto'}
							spaceBetween={15}
							modules={[Autoplay, Navigation, Pagination]}
							navigation={{
								nextEl: '.swiper-top-next',
								prevEl: '.swiper-top-prev',
							}}
							pagination={{
								el: '.swiper-top-pagination',
							}}
						>
							{topClinics.map((clinic: Clinic) => {
								return (
									<SwiperSlide className={'top-property-slide'} key={clinic?._id}>
										<ClinicSlideCard clinic={clinic} likeClinicHandler={likeClinicHandler} cardClass={'top-card-box'} />
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

TopClinics.defaultProps = {
	initialInput: {
		page: 1,
		limit: 8,
		sort: 'clinicRank',
		direction: 'DESC',
		search: {},
	},
};

export default TopClinics;
