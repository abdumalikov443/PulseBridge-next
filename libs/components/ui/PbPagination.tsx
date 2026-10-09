import React from 'react';
import { Pagination } from '@mui/material';

interface PbPaginationProps {
	page: number;
	total: number;
	limit: number;
	onChange: (page: number) => void;
	// what is counted: "doctor" -> "Total 12 doctors available"
	noun: string;
	// lists inside a page section keep the scroll position
	scrollTop?: boolean;
}

// pagination: the total first, then the page numbers (1, 2, 3 ...) in the middle
const PbPagination = ({ page, total, limit, onChange, noun, scrollTop = true }: PbPaginationProps) => {
	if (total === 0) return null;
	const pages = Math.max(1, Math.ceil(total / limit));

	return (
		<div className="pb-pager">
			<p className="pb-pager__total">
				Total {total} {total === 1 ? noun : `${noun}s`} available
			</p>
			{/* page numbers are always shown, even when everything fits on one page */}
			<Pagination
				page={Math.min(page, pages)}
				count={pages}
				onChange={(e, value) => {
					onChange(value);
					if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
				shape="circular"
				color="primary"
			/>
		</div>
	);
};

export default PbPagination;
