import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
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
				deletedAt
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         CLINIC         *
 *************************/

export const GET_ALL_CLINICS_BY_ADMIN = gql`
	query GetAllClinicsByAdmin($input: AllClinicsInquiry!) {
		getAllClinicsByAdmin(input: $input) {
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
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberPhone
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

export const GET_ALL_APPOINTMENTS_BY_ADMIN = gql`
	query GetAllAppointmentsByAdmin($input: AppointmentsInquiry!) {
		getAllAppointmentsByAdmin(input: $input) {
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
				memberData {
					_id
					memberNick
					memberFullName
				}
				doctorData {
					_id
					specialty
					memberData {
						_id
						memberNick
						memberFullName
					}
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

/**************************
 *         ARTICLE        *
 *************************/

export const GET_ALL_ARTICLES_BY_ADMIN = gql`
	query GetAllArticlesByAdmin($input: AllArticlesInquiry!) {
		getAllArticlesByAdmin(input: $input) {
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
 *     FAQ AND NOTICE     *
 *************************/

export const GET_ALL_NOTICES_BY_ADMIN = gql`
	query GetAllNoticesByAdmin($input: AllNoticesInquiry!) {
		getAllNoticesByAdmin(input: $input) {
			list {
				_id
				noticeCategory
				noticeStatus
				faqTopic
				noticeTitle
				noticeContent
				noticePinned
				memberId
				createdAt
				updatedAt
				memberData {
					_id
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
