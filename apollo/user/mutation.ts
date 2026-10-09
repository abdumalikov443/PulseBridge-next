import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
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
			memberPoints
			memberLikes
			memberViews
			memberRank
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
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
			memberPoints
			memberLikes
			memberViews
			memberRank
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
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
			memberPoints
			memberLikes
			memberViews
			memberRank
			createdAt
			updatedAt
			accessToken
		}
	}
`;

/**************************
 *         CLINIC         *
 *************************/

export const UPDATE_CLINIC = gql`
	mutation UpdateClinic($input: ClinicUpdate!) {
		updateClinic(input: $input) {
			_id
			clinicStatus
			clinicType
			clinicName
			clinicAddress
			clinicDesc
			clinicImage
			clinicViews
			clinicLikes
			clinicDoctors
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const LIKE_TARGET_CLINIC = gql`
	mutation LikeTargetClinic($input: String!) {
		likeTargetClinic(clinicId: $input) {
			_id
			clinicName
			clinicLikes
		}
	}
`;

/**************************
 *         DOCTOR         *
 *************************/

export const UPDATE_DOCTOR = gql`
	mutation UpdateDoctor($input: DoctorUpdate!) {
		updateDoctor(input: $input) {
			_id
			memberId
			clinicId
			specialty
			experience
		}
	}
`;

export const LIKE_TARGET_DOCTOR = gql`
	mutation LikeTargetDoctor($input: String!) {
		likeTargetDoctor(doctorId: $input) {
			_id
			doctorLikes
		}
	}
`;

export const REQUEST_JOIN_CLINIC = gql`
	mutation RequestJoinClinic($input: String!) {
		requestJoinClinic(clinicId: $input) {
			_id
			doctorId
			clinicId
			requestStatus
			createdAt
		}
	}
`;

export const CANCEL_JOIN_REQUEST = gql`
	mutation CancelJoinRequest($input: String!) {
		cancelJoinRequest(requestId: $input) {
			_id
			requestStatus
		}
	}
`;

export const RESPOND_JOIN_REQUEST = gql`
	mutation RespondJoinRequest($input: JoinRequestUpdate!) {
		respondJoinRequest(input: $input) {
			_id
			doctorId
			clinicId
			requestStatus
		}
	}
`;

export const REMOVE_DOCTOR = gql`
	mutation RemoveDoctor($input: String!) {
		removeDoctor(doctorId: $input) {
			_id
			clinicId
		}
	}
`;

/**************************
 *       APPOINTMENT      *
 *************************/

export const CREATE_APPOINTMENT = gql`
	mutation CreateAppointment($input: AppointmentInput!) {
		createAppointment(input: $input) {
			_id
			appointmentDate
			appointmentTime
			appointmentStatus
			appointmentReason
			doctorId
			clinicId
		}
	}
`;

export const UPDATE_APPOINTMENT = gql`
	mutation UpdateAppointment($input: AppointmentUpdate!) {
		updateAppointment(input: $input) {
			_id
			appointmentStatus
		}
	}
`;

/**************************
 *         ARTICLE        *
 *************************/

export const CREATE_ARTICLE = gql`
	mutation CreateArticle($input: ArticleInput!) {
		createArticle(input: $input) {
			_id
			articleStatus
			articleTitle
			articleContent
			articleImage
			memberId
			createdAt
		}
	}
`;

export const UPDATE_ARTICLE = gql`
	mutation UpdateArticle($input: ArticleUpdate!) {
		updateArticle(input: $input) {
			_id
			articleStatus
			articleTitle
			articleContent
			articleImage
			memberId
			updatedAt
		}
	}
`;

export const LIKE_TARGET_ARTICLE = gql`
	mutation LikeTargetArticle($input: String!) {
		likeTargetArticle(articleId: $input) {
			_id
			articleLikes
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: FollowInput!) {
		subscribe(input: $input) {
			_id
			followerId
			followGroup
			followRefId
			createdAt
			updatedAt
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: FollowInput!) {
		unsubscribe(input: $input) {
			_id
			followerId
			followGroup
			followRefId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *      NOTIFICATION      *
 *************************/

export const READ_NOTIFICATION = gql`
	mutation ReadNotification($input: String!) {
		readNotification(notificationId: $input) {
			_id
			notificationStatus
		}
	}
`;

export const READ_ALL_NOTIFICATIONS = gql`
	mutation ReadAllNotifications {
		readAllNotifications
	}
`;

/**************************
 *        AI INTAKE       *
 *************************/

// one turn with the AI assistant (guests too); keep sessionKey for the next message
export const INTAKE_CHAT = gql`
	mutation IntakeChat($input: IntakeChatInput!) {
		intakeChat(input: $input) {
			sessionKey
			reply
			ready
			specialty
			urgency
			complaintSummary
			remainingMessages
		}
	}
`;

// after a patient logs in: attach the guest conversation to the account
export const CLAIM_INTAKE_SESSION = gql`
	mutation ClaimIntakeSession($sessionKey: String!) {
		claimIntakeSession(sessionKey: $sessionKey) {
			_id
			ready
			specialty
			urgency
			complaintSummary
		}
	}
`;
