import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Icon from './Icon';

export interface SortOption {
	value: string;
	label: string;
}

interface SortSelectProps {
	value: string;
	options: SortOption[];
	onChange: (value: string) => void;
	label?: string;
}

// sort dropdown in the Soft Care look (the native select list cannot be styled)
const SortSelect = ({ value, options, onChange, label = 'Sort by' }: SortSelectProps) => {
	const id = useId();
	const { t } = useTranslation('common');
	const boxRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const current = options.find((option) => option.value === value) ?? options[0];

	// close on outside click
	useEffect(() => {
		if (!open) return;
		const close = (e: MouseEvent) => {
			if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', close);
		return () => document.removeEventListener('mousedown', close);
	}, [open]);

	const choose = (option: SortOption) => {
		onChange(option.value);
		setOpen(false);
	};

	const openList = () => {
		setActive(
			Math.max(
				0,
				options.findIndex((option) => option.value === value),
			),
		);
		setOpen(true);
	};

	const keyHandler = (e: React.KeyboardEvent) => {
		if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			openList();
			return;
		}
		if (!open) return;
		if (e.key === 'Escape') setOpen(false);
		else if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActive((i) => Math.min(options.length - 1, i + 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActive((i) => Math.max(0, i - 1));
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			choose(options[active]);
		}
	};

	return (
		<div className="pb-sort" ref={boxRef}>
			<button
				type="button"
				className={`pb-sort__button ${open ? 'is-open' : ''}`}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={`${id}-list`}
				onClick={() => (open ? setOpen(false) : openList())}
				onKeyDown={keyHandler}
			>
				<Icon name="menu" size={16} />
				<span className="pb-sort__label">{t(label)}:</span>
				<strong>{current ? t(current.label) : null}</strong>
				<Icon name="arrow" size={14} className="pb-sort__chevron" />
			</button>
			{open && (
				<ul className="pb-sort__list" role="listbox" id={`${id}-list`} aria-label={t(label)}>
					{options.map((option, index) => {
						const selected = option.value === current?.value;
						return (
							<li
								key={option.value}
								role="option"
								aria-selected={selected}
								className={`pb-sort__option ${selected ? 'is-selected' : ''} ${index === active ? 'is-active' : ''}`}
								onMouseEnter={() => setActive(index)}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => choose(option)}
							>
								{t(option.label)}
								{selected && <Icon name="check" size={16} />}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

export default SortSelect;
