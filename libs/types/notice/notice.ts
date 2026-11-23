import { FaqTopic, NoticeCategory, NoticeStatus } from '../../enums/notice.enum';
import { TotalCounter } from '../common';
import { Member } from '../member/member';

export interface Notice {
	_id: string;
	noticeCategory: NoticeCategory;
	noticeStatus: NoticeStatus;
	faqTopic?: FaqTopic | null;
	noticeTitle: string;
	noticeContent: string;
	noticePinned: boolean;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation (admin list) **/
	memberData?: Member;
}

export interface Notices {
	list: Notice[];
	metaCounter: TotalCounter[];
}
