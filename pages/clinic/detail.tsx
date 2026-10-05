import React, { ChangeEvent, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../../libs/components/common/Review';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation, Pagination } from 'swiper';
import ClinicBigCard from '../../libs/components/common/ClinicBigCard';
import DoctorCard from '../../libs/components/common/DoctorCard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Clinic } from '../../libs/types/clinic/clinic';
import { Doctor } from '../../libs/types/doctor/doctor';
import moment from 'moment';
import { formatEnum } from '../../libs/utils';
import { COMMENT_CONTENT_MAX, DEFAULT_CLINIC_IMAGE, getImageUrl, getMemberName } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Pagination as MuiPagination } from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import 'swiper/css';
import 'swiper/css/pagination';
import { GET_CLINIC, GET_CLINICS, GET_COMMENTS, GET_DOCTORS } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CREATE_COMMENT, LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { sweetErrorAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

SwiperCore.use([Autoplay, Navigation, Pagination]);

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const otherClinicsInput = {
	page: 1,
	limit: 5,
	sort: 'clinicRank',
	direction: Direction.DESC,
	search: {},
};

const ClinicDetail: NextPage = ({ initialComment, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [clinicId, setClinicId] = useState<string | null>(null);
	const [clinic, setClinic] = useState<Clinic | null>(null);
	const [clinicDoctors, setClinicDoctors] = useState<Doctor[]>([]);
	const [otherClinics, setOtherClinics] = useState<Clinic[]>([]);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [clinicComments, setClinicComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.CLINIC,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [likeTargetClinic] = useMutation(LIKE_TARGET_CLINIC);
	const [likeTargetDoctor] = useMutation(LIKE_TARGET_DOCTOR);
	const [createComment] = useMutation(CREATE_COMMENT);

	const { loading: getClinicLoading, refetch: getClinicRefetch } = useQuery(GET_CLINIC, {
		fetchPolicy: 'network-only',
		variables: { input: clinicId },
		skip: !clinicId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getClinic) setClinic(data.getClinic);
		},
	});

	const { refetch: getDoctorsRefetch } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 20, sort: 'doctorRank', direction: Direction.DESC, search: { clinicId } } },
		skip: !clinicId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setClinicDoctors(data?.getDoctors?.list ?? []);
		},
	});

	const { refetch: getClinicsRefetch } = useQuery(GET_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: otherClinicsInput },
		skip: !clinicId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			const list: Clinic[] = data?.getClinics?.list ?? [];
			setOtherClinics(list.filter((ele: Clinic) => ele._id !== clinicId).slice(0, 4));
		},
	});

	const { refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: initialComment },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getComments?.list) setClinicComments(data?.getComments?.list);
			setCommentTotal(data?.getComments?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/

	useEffect(() => {
		if (router.query.id) {
			setClinicId(router.query.id as string);
			setCommentInquiry({
				...commentInquiry,
				search: {
					commentRefId: router.query.id as string,
				},
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: router.query.id as string,
			});
		}
	}, [router]);

	useEffect(() => {
		if (commentInquiry.search.commentRefId) {
			getCommentsRefetch({ input: commentInquiry });
		}
	}, [commentInquiry]);

	/** HANDLERS **/

	const likeClinicHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetClinic({ variables: { input: id } });
			await getClinicRefetch({ input: clinicId });
			await getClinicsRefetch({ input: otherClinicsInput });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeClinicHandler:', err.message);
			sweetErrorAlert(err.message).then();
		}
	};

	const likeDoctorHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetDoctor({ variables: { input: id } });
			await getDoctorsRefetch();
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeDoctorHandler:', err.message);
			sweetErrorAlert(err.message).then();
		}
	};

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		setCommentInquiry({ ...commentInquiry, page: value });
	};

	const createCommentsHandler = async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await createComment({ variables: { input: insertCommentData } });
			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			await getCommentsRefetch({ input: commentInquiry });
		} catch (err) {
			await sweetErrorHandling(err);
		}
	};

	if (getClinicLoading && !clinic) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '1080px' }}>
				<CircularProgress size={'4rem'} />
			</Stack>
		);
	}

	if (device === 'mobile') {
		return <div>CLINIC DETAIL PAGE</div>;
	} else {
		return (
			<div id={'property-detail-page'}>
				<div className={'container'}>
					<Stack className={'property-detail-config'}>
						<Stack className={'property-info-config'}>
							<Stack className={'info'}>
								<Stack className={'left-box'}>
									<Typography className={'title-main'}>{clinic?.clinicName}</Typography>
									<Stack className={'top-box'}>
										<Typography className={'city'}>{formatEnum(clinic?.clinicType)} clinic</Typography>
										<Stack className={'divider'}></Stack>
										<Typography className={'date'}>Since {moment(clinic?.createdAt).format('YYYY')}</Typography>
									</Stack>
									<Stack className={'bottom-box'}>
										<Stack className="option">
											<img src="/img/icons/user.svg" alt="" /> <Typography>{clinic?.clinicDoctors} doctors</Typography>
										</Stack>
										<Stack className="option">
											<img src="/img/icons/review.svg" alt="" /> <Typography>{clinic?.clinicComments} reviews</Typography>
										</Stack>
									</Stack>
								</Stack>
								<Stack className={'right-box'}>
									<Stack className="buttons">
										<Stack className="button-box">
											<RemoveRedEyeIcon fontSize="medium" />
											<Typography>{clinic?.clinicViews}</Typography>
										</Stack>
										<Stack className="button-box">
											{clinic?.meLiked && clinic?.meLiked[0]?.myFavorite ? (
												<FavoriteIcon
													color="primary"
													fontSize={'medium'}
													onClick={() => likeClinicHandler(user, clinic?._id as string)}
												/>
											) : (
												<FavoriteBorderIcon
													fontSize={'medium'}
													onClick={() => likeClinicHandler(user, clinic?._id as string)}
												/>
											)}
											<Typography>{clinic?.clinicLikes}</Typography>
										</Stack>
									</Stack>
									<Typography>{clinic?.clinicAddress}</Typography>
								</Stack>
							</Stack>
							<Stack className={'images'}>
								<Stack className={'main-image'}>
									<img src={getImageUrl(clinic?.clinicImage, DEFAULT_CLINIC_IMAGE)} alt={'main-image'} />
								</Stack>
							</Stack>
						</Stack>
						<Stack className={'property-desc-config'}>
							<Stack className={'left-config'}>
								<Stack className={'prop-desc-config'}>
									<Stack className={'top'}>
										<Typography className={'title'}>About the Clinic</Typography>
										<Typography className={'desc'}>{clinic?.clinicDesc ?? 'No Description!'}</Typography>
									</Stack>
									<Stack className={'bottom'}>
										<Typography className={'title'}>Clinic Details</Typography>
										<Stack className={'info-box'}>
											<Stack className={'left'}>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Type</Typography>
													<Typography className={'data'}>{formatEnum(clinic?.clinicType)}</Typography>
												</Box>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Doctors</Typography>
													<Typography className={'data'}>{clinic?.clinicDoctors}</Typography>
												</Box>
											</Stack>
											<Stack className={'right'}>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Address</Typography>
													<Typography className={'data'}>{clinic?.clinicAddress}</Typography>
												</Box>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Since</Typography>
													<Typography className={'data'}>{moment(clinic?.createdAt).format('YYYY')}</Typography>
												</Box>
											</Stack>
										</Stack>
									</Stack>
								</Stack>
								{commentTotal !== 0 && (
									<Stack className={'reviews-config'}>
										<Stack className={'filter-box'}>
											<Stack className={'review-cnt'}>
												<Typography className={'reviews'}>{commentTotal} reviews</Typography>
											</Stack>
										</Stack>
										<Stack className={'review-list'}>
											{clinicComments?.map((comment: Comment) => {
												return <Review comment={comment} key={comment?._id} />;
											})}
											<Box component={'div'} className={'pagination-box'}>
												<MuiPagination
													page={commentInquiry.page}
													count={Math.ceil(commentTotal / commentInquiry.limit)}
													onChange={commentPaginationChangeHandler}
													shape="circular"
													color="primary"
												/>
											</Box>
										</Stack>
									</Stack>
								)}
								<Stack className={'leave-review-config'}>
									<Typography className={'main-title'}>Leave A Review</Typography>
									<Typography className={'review-title'}>Review</Typography>
									<textarea
										maxLength={COMMENT_CONTENT_MAX}
										onChange={({ target: { value } }: any) => {
											setInsertCommentData({ ...insertCommentData, commentContent: value });
										}}
										value={insertCommentData.commentContent}
									></textarea>
									<Box className={'submit-btn'} component={'div'}>
										<Button
											className={'submit-review'}
											disabled={insertCommentData.commentContent === '' || user?._id === ''}
											onClick={createCommentsHandler}
										>
											<Typography className={'title'}>Submit Review</Typography>
										</Button>
									</Box>
								</Stack>
							</Stack>
							<Stack className={'right-config'}>
								<Stack className={'info-box'}>
									<Typography className={'main-title'}>Clinic Contact</Typography>
									<Stack className={'image-info'}>
										<img className={'member-image'} src={getImageUrl(clinic?.memberData?.memberImage)} />
										<Stack className={'name-phone-listings'}>
											<Typography className={'name'}>{getMemberName(clinic?.memberData)}</Typography>
											<Stack className={'phone-number'}>
												<Typography className={'number'}>{clinic?.memberData?.memberPhone}</Typography>
											</Stack>
										</Stack>
									</Stack>
								</Stack>
								<Stack className={'info-box'}>
									<Typography className={'sub-title'}>Book an appointment</Typography>
									<Typography className={'sub-title'}>
										Choose a doctor below and book a visit from the doctor's page.
									</Typography>
								</Stack>
							</Stack>
						</Stack>
						{clinicDoctors.length !== 0 && (
							<Stack className={'similar-properties-config'}>
								<Stack className={'title-pagination-box'}>
									<Stack className={'title-box'}>
										<Typography className={'main-title'}>Our Doctors</Typography>
										<Typography className={'sub-title'}>Doctors working at {clinic?.clinicName}</Typography>
									</Stack>
								</Stack>
								<Stack className={'cards-box'} sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '24px' }}>
									{clinicDoctors.map((doctor: Doctor) => (
										<DoctorCard doctor={doctor} key={doctor._id} likeDoctorHandler={likeDoctorHandler} />
									))}
								</Stack>
							</Stack>
						)}
						{otherClinics.length !== 0 && (
							<Stack className={'similar-properties-config'}>
								<Stack className={'title-pagination-box'}>
									<Stack className={'title-box'}>
										<Typography className={'main-title'}>Other Clinics</Typography>
										<Typography className={'sub-title'}>Top rated clinics on PulseBridge</Typography>
									</Stack>
									<Stack className={'pagination-box'}>
										<WestIcon className={'swiper-similar-prev'} />
										<div className={'swiper-similar-pagination'}></div>
										<EastIcon className={'swiper-similar-next'} />
									</Stack>
								</Stack>
								<Stack className={'cards-box'}>
									<Swiper
										className={'similar-homes-swiper'}
										slidesPerView={'auto'}
										spaceBetween={35}
										modules={[Autoplay, Navigation, Pagination]}
										navigation={{
											nextEl: '.swiper-similar-next',
											prevEl: '.swiper-similar-prev',
										}}
										pagination={{
											el: '.swiper-similar-pagination',
										}}
									>
										{otherClinics.map((ele: Clinic) => {
											return (
												<SwiperSlide className={'similar-homes-slide'} key={ele._id}>
													<ClinicBigCard clinic={ele} likeClinicHandler={likeClinicHandler} />
												</SwiperSlide>
											);
										})}
									</Swiper>
								</Stack>
							</Stack>
						)}
					</Stack>
				</div>
			</div>
		);
	}
};

ClinicDetail.defaultProps = {
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			commentRefId: '',
		},
	},
};

export default withLayoutFull(ClinicDetail);
