import React from 'react';
import { Pagination } from '@mui/material';

interface PbPaginationProps {
	page: number;
	total: number;
	limit: number;
	onChange: (page: number) => void;
	// lists inside a page section keep the scroll position
	scrollTop?: boolean;
}

// page numbers (1, 2, 3 ...) in the middle; each page shows its own total at the top
const PbPagination = ({ page, total, limit, onChange, scrollTop = true }: PbPaginationProps) => {
	if (total === 0) return null;
	const pages = Math.max(1, Math.ceil(total / limit));

	return (
		<div className="pb-pager">
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
