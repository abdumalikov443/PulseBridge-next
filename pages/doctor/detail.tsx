import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ReviewCard from '../../libs/components/doctor/ReviewCard';
import BookAppointment from '../../libs/components/doctor/BookAppointment';
import { Box, Button, Pagination, Stack, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Doctor } from '../../libs/types/doctor/doctor';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { COMMENT_CONTENT_MAX, getImageUrl, getMemberName, Messages } from '../../libs/config';
import { formatEnum } from '../../libs/utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { T } from '../../libs/types/common';
import { CREATE_COMMENT, LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { GET_COMMENTS, GET_DOCTOR } from '../../apollo/user/query';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const DoctorDetail: NextPage = ({ initialComment, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [doctorId, setDoctorId] = useState<string | null>(null);
	const [doctor, setDoctor] = useState<Doctor | null>(null);
	const [openBooking, setOpenBooking] = useState<boolean>(false);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [doctorComments, setDoctorComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.DOCTOR,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [createComment] = useMutation(CREATE_COMMENT);
	const [likeTargetDoctor] = useMutation(LIKE_TARGET_DOCTOR);

	const { refetch: getDoctorRefetch } = useQuery(GET_DOCTOR, {
		fetchPolicy: 'network-only',
		variables: { input: doctorId },
		skip: !doctorId,
		onCompleted: (data: T) => {
			setDoctor(data?.getDoctor);
		},
	});

	const { refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		variables: { input: commentInquiry },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDoctorComments(data?.getComments?.list);
			setCommentTotal(data?.getComments?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/

	useEffect(() => {
		const id = router.query.id as string;
		if (id) {
			setDoctorId(id);
			setCommentInquiry({ ...commentInquiry, search: { commentRefId: id } });
			setInsertCommentData({ ...insertCommentData, commentRefId: id });
		}
	}, [router]);

	/** HANDLERS **/

	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		setCommentInquiry({ ...commentInquiry, page: value });
	};

	const createCommentHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (user._id === doctor?.memberId) throw new Error('Cannot write a review for yourself!');
			await createComment({
				variables: { input: insertCommentData },
			});
			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			await getCommentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const likeDoctorHandler = async () => {
		try {
			if (!doctorId) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetDoctor({ variables: { input: doctorId } });
			await getDoctorRefetch({ input: doctorId });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeDoctorHandler: ', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const bookingHandler = () => {
		if (!user?._id) {
			sweetMixinErrorAlert(Messages.error2).then();
			return;
		}
		setOpenBooking(true);
	};

	if (device === 'mobile') {
		return <div>DOCTOR DETAIL PAGE MOBILE</div>;
	} else {
		return (
			<Stack className={'agent-detail-page'}>
				<Stack className={'container'}>
					<Stack className={'agent-info'}>
						<img src={getImageUrl(doctor?.memberData?.memberImage)} alt="" />
						<Box
							component={'div'}
							className={'info'}
							onClick={() => redirectToMemberPageHandler(doctor?.memberId as string)}
						>
							<strong>{getMemberName(doctor?.memberData)}</strong>
							<div>
								<img src="/img/icons/call.svg" alt="" />
								<span>{doctor?.memberData?.memberPhone}</span>
							</div>
						</Box>
					</Stack>
					<Stack className={'agent-home-list'}>
						<Stack className={'doctor-profile'} gap={'12px'} sx={{ padding: '24px 0' }}>
							<Typography>
								<strong>Specialty:</strong> {formatEnum(doctor?.specialty)}
							</Typography>
							<Typography>
								<strong>Experience:</strong> {doctor?.experience} years
							</Typography>
							{doctor?.clinicData && (
								<Typography>
									<strong>Clinic:</strong>{' '}
									<Link href={`/clinic/detail?id=${doctor.clinicData._id}`}>{doctor.clinicData.clinicName}</Link>
									{` · ${doctor.clinicData.clinicAddress}`}
								</Typography>
							)}
							{doctor?.memberData?.memberDesc && <Typography>{doctor.memberData.memberDesc}</Typography>}
							<Stack direction={'row'} alignItems={'center'} gap={'16px'}>
								<Stack direction={'row'} alignItems={'center'} gap={'4px'}>
									<RemoveRedEyeIcon />
									<Typography>{doctor?.doctorViews}</Typography>
								</Stack>
								<Stack direction={'row'} alignItems={'center'} gap={'4px'} sx={{ cursor: 'pointer' }} onClick={likeDoctorHandler}>
									{doctor?.meLiked && doctor?.meLiked[0]?.myFavorite ? <FavoriteIcon color={'primary'} /> : <FavoriteBorderIcon />}
									<Typography>{doctor?.doctorLikes}</Typography>
								</Stack>
								{(!user?._id || user?.memberType === MemberType.PATIENT) && (
									<Button variant={'contained'} onClick={bookingHandler}>
										Book an appointment
									</Button>
								)}
							</Stack>
						</Stack>
					</Stack>
					<Stack className={'review-box'}>
						<Stack className={'main-intro'}>
							<span>Reviews</span>
							<p>what patients say about this doctor</p>
						</Stack>
						{commentTotal !== 0 && (
							<Stack className={'review-wrap'}>
								<Box component={'div'} className={'title-box'}>
									<StarIcon />
									<span>
										{commentTotal} review{commentTotal > 1 ? 's' : ''}
									</span>
								</Box>
								{doctorComments?.map((comment: Comment) => {
									return <ReviewCard comment={comment} key={comment?._id} />;
								})}
								<Box component={'div'} className={'pagination-box'}>
									<Pagination
										page={commentInquiry.page}
										count={Math.ceil(commentTotal / commentInquiry.limit) || 1}
										onChange={commentPaginationChangeHandler}
										shape="circular"
										color="primary"
									/>
								</Box>
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
									onClick={createCommentHandler}
								>
									<Typography className={'title'}>Submit Review</Typography>
								</Button>
							</Box>
						</Stack>
					</Stack>
				</Stack>
				{doctorId && (
					<BookAppointment
						open={openBooking}
						doctorId={doctorId}
						doctorName={getMemberName(doctor?.memberData)}
						onClose={() => setOpenBooking(false)}
					/>
				)}
			</Stack>
		);
	}
};

DoctorDetail.defaultProps = {
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

export default withLayoutBasic(DoctorDetail);
