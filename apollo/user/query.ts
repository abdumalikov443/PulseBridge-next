import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_MEMBER = gql(`
	query GetMember($input: String!) {
		getMember(memberId: $input) {
			_id
			memberType
			memberStatus
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberArticles
			memberFollowers
			memberFollowings
			memberPoints
			memberLikes
			memberViews
			memberComments
			memberRank
			deletedAt
			createdAt
			updatedAt
		}
	}
`);

/**************************
 *         CLINIC         *
 *************************/

export const GET_CLINIC = gql`
	query GetClinic($input: String!) {
		getClinic(clinicId: $input) {
			_id
			clinicStatus
			clinicType
			clinicName
			clinicAddress
			clinicDesc
			clinicImage
			clinicOpenTime
			clinicCloseTime
			clinicBreakStart
			clinicBreakEnd
			clinicOffDays
			clinicViews
			clinicLikes
			clinicComments
			clinicFollowers
			clinicDoctors
			clinicRank
			memberId
			createdAt
			updatedAt
			memberData {
				_id
				memberType
				memberNick
				memberFullName
				memberImage
				memberPhone
				memberAddress
				memberFollowers
				memberFollowings
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			meFollowed {
				followerId
				followRefId
				myFollowing
			}
		}
	}
`;

export const GET_CLINICS = gql`
	query GetClinics($input: ClinicsInquiry!) {
		getClinics(input: $input) {
			list {
				_id
				clinicStatus
				clinicType
				clinicName
				clinicAddress
				clinicDesc
				clinicImage
				clinicViews
				clinicLikes
				clinicComments
				clinicFollowers
				clinicDoctors
				clinicRank
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followerId
					followRefId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_CLINIC = gql`
	query GetMyClinic {
		getMyClinic {
			_id
			clinicStatus
			clinicType
			clinicName
			clinicAddress
			clinicDesc
			clinicImage
			clinicOpenTime
			clinicCloseTime
			clinicBreakStart
			clinicBreakEnd
			clinicOffDays
			clinicViews
			clinicLikes
			clinicComments
			clinicFollowers
			clinicDoctors
			clinicRank
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const GET_FAVORITE_CLINICS = gql`
	query GetFavoriteClinics($input: OrdinaryInquiry!) {
		getFavoriteClinics(input: $input) {
			list {
				_id
				clinicStatus
				clinicType
				clinicName
				clinicAddress
				clinicDesc
				clinicImage
				clinicViews
				clinicLikes
				clinicComments
				clinicDoctors
				clinicRank
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_VISITED_CLINICS = gql`
	query GetVisitedClinics($input: OrdinaryInquiry!) {
		getVisitedClinics(input: $input) {
			list {
				_id
				clinicStatus
				clinicType
				clinicName
				clinicAddress
				clinicDesc
				clinicImage
				clinicViews
				clinicLikes
				clinicComments
				clinicDoctors
				clinicRank
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         DOCTOR         *
 *************************/

export const GET_DOCTOR = gql`
	query GetDoctor($input: String!) {
		getDoctor(doctorId: $input) {
			_id
			memberId
			clinicId
			specialty
			experience
			doctorViews
			doctorLikes
			doctorComments
			doctorFollowers
			doctorRank
			createdAt
			updatedAt
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			meFollowed {
				followerId
				followRefId
				myFollowing
			}
			memberData {
				_id
				memberNick
				memberFullName
				memberImage
				memberPhone
				memberDesc
				memberFollowers
				memberFollowings
			}
			clinicData {
				_id
				clinicType
				clinicName
				clinicAddress
				clinicImage
				clinicOpenTime
				clinicCloseTime
				clinicBreakStart
				clinicBreakEnd
				clinicOffDays
			}
		}
	}
`;

export const GET_DOCTORS = gql`
	query GetDoctors($input: DoctorsInquiry!) {
		getDoctors(input: $input) {
			list {
				_id
				memberId
				clinicId
				specialty
				experience
				doctorViews
				doctorLikes
				doctorComments
				doctorFollowers
				doctorRank
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followerId
					followRefId
					myFollowing
				}
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
				}
				clinicData {
					_id
					clinicType
					clinicName
					clinicAddress
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_DOCTOR_PROFILE = gql`
	query GetMyDoctorProfile {
		getMyDoctorProfile {
			_id
			memberId
			clinicId
			specialty
			experience
			doctorViews
			doctorLikes
			doctorComments
			doctorFollowers
			doctorRank
			createdAt
			updatedAt
			clinicData {
				_id
				clinicType
				clinicName
				clinicAddress
				clinicImage
			}
		}
	}
`;

export const GET_FAVORITE_DOCTORS = gql`
	query GetFavoriteDoctors($input: OrdinaryInquiry!) {
		getFavoriteDoctors(input: $input) {
			list {
				_id
				memberId
				clinicId
				specialty
				experience
				doctorViews
				doctorLikes
				doctorComments
				doctorRank
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
				}
				clinicData {
					_id
					clinicName
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_VISITED_DOCTORS = gql`
	query GetVisitedDoctors($input: OrdinaryInquiry!) {
		getVisitedDoctors(input: $input) {
			list {
				_id
				memberId
				clinicId
				specialty
				experience
				doctorViews
				doctorLikes
				doctorComments
				doctorRank
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
				}
				clinicData {
					_id
					clinicName
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_JOIN_REQUESTS = gql`
	query GetMyJoinRequests($input: OrdinaryInquiry!) {
		getMyJoinRequests(input: $input) {
			list {
				_id
				doctorId
				clinicId
				requestStatus
				createdAt
				updatedAt
				clinicData {
					_id
					clinicType
					clinicName
					clinicAddress
					clinicImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_CLINIC_JOIN_REQUESTS = gql`
	query GetClinicJoinRequests($input: OrdinaryInquiry!) {
		getClinicJoinRequests(input: $input) {
			list {
				_id
				doctorId
				clinicId
				requestStatus
				createdAt
				updatedAt
				doctorData {
					_id
					specialty
					experience
					memberData {
						_id
						memberNick
						memberFullName
						memberImage
						memberPhone
					}
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *       APPOINTMENT      *
 *************************/

// one appointment for its confirmation page (patient, doctor, clinic owner or ADMIN)
export const GET_APPOINTMENT = gql`
	query GetAppointment($appointmentId: String!) {
		getAppointment(appointmentId: $appointmentId) {
			_id
			appointmentDate
			appointmentTime
			appointmentStatus
			appointmentReason
			memberId
			doctorId
			clinicId
			createdAt
			updatedAt
			memberData {
				_id
				memberNick
				memberFullName
				memberImage
				memberPhone
			}
			doctorData {
				_id
				memberId
				specialty
				experience
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberPhone
				}
			}
			clinicData {
				_id
				memberId
				clinicName
				clinicType
				clinicAddress
				clinicImage
			}
		}
	}
`;

// free / booked 30-minute slots of a doctor for the next 5 days (from tomorrow)
export const GET_DOCTOR_AVAILABILITY = gql`
	query GetDoctorAvailability($doctorId: String!) {
		getDoctorAvailability(doctorId: $doctorId) {
			date
			dayOfWeek
			isOpen
			slots {
				time
				available
			}
		}
	}
`;

const APPOINTMENT_LIST_FIELDS = `
	list {
		_id
		appointmentDate
		appointmentTime
		appointmentStatus
		appointmentReason
		memberId
		doctorId
		clinicId
		createdAt
		updatedAt
		memberData {
			_id
			memberNick
			memberFullName
			memberImage
			memberPhone
		}
		doctorData {
			_id
			specialty
			memberData {
				_id
				memberNick
				memberFullName
				memberImage
			}
		}
		clinicData {
			_id
			clinicName
			clinicAddress
		}
	}
	metaCounter {
		total
	}
`;

export const GET_MY_APPOINTMENTS = gql`
	query GetMyAppointments($input: AppointmentsInquiry!) {
		getMyAppointments(input: $input) {
			${APPOINTMENT_LIST_FIELDS}
		}
	}
`;

export const GET_DOCTOR_APPOINTMENTS = gql`
	query GetDoctorAppointments($input: AppointmentsInquiry!) {
		getDoctorAppointments(input: $input) {
			${APPOINTMENT_LIST_FIELDS}
		}
	}
`;

export const GET_CLINIC_APPOINTMENTS = gql`
	query GetClinicAppointments($input: AppointmentsInquiry!) {
		getClinicAppointments(input: $input) {
			${APPOINTMENT_LIST_FIELDS}
		}
	}
`;

/**************************
 *         ARTICLE        *
 *************************/

export const GET_ARTICLE = gql`
	query GetArticle($input: String!) {
		getArticle(articleId: $input) {
			_id
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
			memberId
			createdAt
			updatedAt
			memberData {
				_id
				memberType
				memberNick
				memberFullName
				memberImage
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_ARTICLES = gql`
	query GetArticles($input: ArticlesInquiry!) {
		getArticles(input: $input) {
			list {
				_id
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				articleComments
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				memberData {
					_id
					memberType
					memberNick
					memberFullName
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberType
					memberNick
					memberFullName
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/
// members who follow a doctor profile or a clinic
export const GET_FOLLOWERS = gql`
	query GetFollowers($input: FollowersInquiry!) {
		getFollowers(input: $input) {
			list {
				_id
				followerId
				followGroup
				followRefId
				createdAt
				followerData {
					_id
					memberType
					memberNick
					memberFullName
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

// doctors and clinics a member follows
export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowingsInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followerId
				followGroup
				followRefId
				createdAt
				meFollowed {
					followerId
					followRefId
					myFollowing
				}
				doctorData {
					_id
					memberId
					clinicId
					specialty
					experience
					doctorLikes
					doctorFollowers
					memberData {
						_id
						memberNick
						memberFullName
						memberImage
					}
				}
				clinicData {
					_id
					memberId
					clinicName
					clinicType
					clinicImage
					clinicAddress
					clinicLikes
					clinicFollowers
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *      NOTIFICATION      *
 *************************/

export const GET_NOTIFICATIONS = gql`
	query GetNotifications($input: NotificationsInquiry!) {
		getNotifications(input: $input) {
			list {
				_id
				notificationType
				notificationStatus
				notificationGroup
				notificationTitle
				notificationDesc
				authorId
				receiverId
				articleId
				appointmentId
				createdAt
				authorData {
					_id
					memberNick
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        AI INTAKE       *
 *************************/

export const GET_INTAKE_SESSION = gql`
	query GetIntakeSession($sessionKey: String!) {
		getIntakeSession(sessionKey: $sessionKey) {
			_id
			messages {
				role
				content
			}
			ready
			specialty
			urgency
			complaintSummary
			expiresAt
		}
	}
`;

// top doctors for the specialty the assistant suggested (patients)
export const GET_INTAKE_RECOMMENDATIONS = gql`
	query GetIntakeRecommendations($sessionKey: String!) {
		getIntakeRecommendations(sessionKey: $sessionKey) {
			list {
				_id
				specialty
				experience
				doctorLikes
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
				}
				clinicData {
					_id
					clinicName
				}
			}
		}
	}
`;
