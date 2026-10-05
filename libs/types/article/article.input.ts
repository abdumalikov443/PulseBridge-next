import { ArticleStatus } from '../../enums/article.enum';
import { Direction } from '../../enums/common.enum';

export interface ArticleInput {
	articleTitle: string;
	articleContent: string;
	articleImage?: string;
}

interface AISearch {
	text?: string;
	memberId?: string;
}

export interface ArticlesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AISearch;
}

interface AAISearch {
	articleStatus?: ArticleStatus;
}

export interface AllArticlesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AAISearch;
}
