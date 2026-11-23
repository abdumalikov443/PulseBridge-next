import { FaqTopic, NoticeCategory, NoticeStatus } from '../../enums/notice.enum';
import { Direction } from '../../enums/common.enum';

export interface NoticeInput {
	noticeCategory: NoticeCategory;
	// required for FAQ, not allowed for NOTICE
	faqTopic?: FaqTopic;
	noticeTitle: string;
	noticeContent: string;
	// HOLD keeps it as a draft
	noticeStatus?: NoticeStatus.HOLD | NoticeStatus.ACTIVE;
	noticePinned?: boolean;
}

interface NISearch {
	noticeCategory: NoticeCategory;
	faqTopic?: FaqTopic;
	text?: string;
}

// public list: only ACTIVE, pinned first then newest
export interface NoticesInquiry {
	page: number;
	limit: number;
	search: NISearch;
}

interface ANISearch {
	noticeCategory?: NoticeCategory;
	noticeStatus?: NoticeStatus;
	faqTopic?: FaqTopic;
	text?: string;
}

export interface AllNoticesInquiry {
	page: number;
	limit: number;
	// createdAt | updatedAt
	sort?: string;
	direction?: Direction;
	search: ANISearch;
}
