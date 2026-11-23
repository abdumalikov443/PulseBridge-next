import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Icon from '../ui/Icon';

// an id in an admin table; a small copy button shows on row hover or keyboard focus
const CopyId = ({ id }: { id: string }) => {
	const { t } = useTranslation('common');
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 1500);
		return () => clearTimeout(timer);
	}, [copied]);

	const copyHandler = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(id);
			setCopied(true);
		} catch {}
	};

	return (
		<span className="pb-copy-id">
			<span className="pb-copy-id__text">{id}</span>
			<button
				type="button"
				className={`pb-copy-id__btn ${copied ? 'is-copied' : ''}`}
				aria-label={copied ? t('ID copied') : t('Copy ID')}
				title={copied ? t('Copied') : t('Copy ID')}
				onClick={copyHandler}
			>
				<Icon name={copied ? 'check' : 'copy'} size={14} />
			</button>
		</span>
	);
};

export default CopyId;
