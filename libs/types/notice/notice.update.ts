import { FaqTopic, NoticeStatus } from '../../enums/notice.enum';

// noticeCategory cannot be changed
export interface NoticeUpdate {
	_id: string;
	noticeStatus?: NoticeStatus;
	faqTopic?: FaqTopic;
	noticeTitle?: string;
	noticeContent?: string;
	noticePinned?: boolean;
}
