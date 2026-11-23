import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberUpdate!) {
		updateMemberByAdmin(input: $input) {
			_id
			memberType
			memberStatus
			memberPhone
			memberNick
			memberFullName
			memberImage
			updatedAt
		}
	}
`;

/**************************
 *         CLINIC         *
 *************************/

export const UPDATE_CLINIC_BY_ADMIN = gql`
	mutation UpdateClinicByAdmin($input: ClinicUpdate!) {
		updateClinicByAdmin(input: $input) {
			_id
			clinicStatus
			clinicType
			clinicName
			updatedAt
		}
	}
`;

export const REMOVE_CLINIC_BY_ADMIN = gql`
	mutation RemoveClinicByAdmin($input: String!) {
		removeClinicByAdmin(clinicId: $input) {
			_id
			clinicStatus
			clinicName
		}
	}
`;

/**************************
 *         DOCTOR         *
 *************************/

export const REMOVE_DOCTOR_BY_ADMIN = gql`
	mutation RemoveDoctorByAdmin($input: String!) {
		removeDoctorByAdmin(doctorId: $input) {
			_id
			clinicId
		}
	}
`;

/**************************
 *         ARTICLE        *
 *************************/

export const UPDATE_ARTICLE_BY_ADMIN = gql`
	mutation UpdateArticleByAdmin($input: ArticleUpdate!) {
		updateArticleByAdmin(input: $input) {
			_id
			articleStatus
			articleTitle
			updatedAt
		}
	}
`;

export const REMOVE_ARTICLE_BY_ADMIN = gql`
	mutation RemoveArticleByAdmin($input: String!) {
		removeArticleByAdmin(articleId: $input) {
			_id
			articleStatus
			articleTitle
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const UPDATE_COMMENT_BY_ADMIN = gql`
	mutation UpdateCommentByAdmin($input: CommentUpdate!) {
		updateCommentByAdmin(input: $input) {
			_id
			commentStatus
			commentContent
		}
	}
`;

export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($input: String!) {
		removeCommentByAdmin(commentId: $input) {
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
 *     FAQ AND NOTICE     *
 *************************/

export const CREATE_NOTICE = gql`
	mutation CreateNotice($input: NoticeInput!) {
		createNotice(input: $input) {
			_id
			noticeCategory
			noticeStatus
			faqTopic
			noticeTitle
			noticeContent
			noticePinned
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_NOTICE = gql`
	mutation UpdateNotice($input: NoticeUpdate!) {
		updateNotice(input: $input) {
			_id
			noticeCategory
			noticeStatus
			faqTopic
			noticeTitle
			noticeContent
			noticePinned
			createdAt
			updatedAt
		}
	}
`;

// permanent delete, only after the status is DELETE
export const REMOVE_NOTICE = gql`
	mutation RemoveNotice($input: String!) {
		removeNotice(noticeId: $input) {
			_id
		}
	}
`;
