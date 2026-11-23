import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { tr } from '../../i18n';
import { Messages, REACT_APP_API_URL } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import Icon from './Icon';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_MB = 5;

interface ImagePickerProps {
	file: File | null;
	onChange: (file: File | null) => void;
	label: string;
	hint?: string;
	// image already saved on the server (path from the API)
	current?: string | null;
	// round for a person, wide for a clinic cover
	shape?: 'round' | 'wide';
}

// picks an image and shows a local preview; nothing is uploaded until the form is saved
const ImagePicker = ({ file, onChange, label, hint, current, shape = 'round' }: ImagePickerProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const { t } = useTranslation('common');
	const [preview, setPreview] = useState<string | null>(null);

	useEffect(() => {
		if (!file) return setPreview(null);
		const url = URL.createObjectURL(file);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const shown = preview ?? (current ? `${REACT_APP_API_URL}/${current}` : null);

	const pickHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const picked = e.target.files?.[0];
		e.target.value = '';
		if (!picked) return;
		if (!ALLOWED.includes(picked.type)) return sweetMixinErrorAlert(Messages.error5);
		if (picked.size > MAX_MB * 1024 * 1024)
			return sweetMixinErrorAlert(tr('Image must be smaller than {{size}} MB', { size: MAX_MB }));
		onChange(picked);
	};

	return (
		<div className={`pb-picker pb-picker--${shape}`}>
			<button
				type="button"
				className="pb-picker__frame"
				onClick={() => inputRef.current?.click()}
				aria-label={`${shown ? t('Change') : t('Choose photo')}: ${t(label)}`}
			>
				{shown ? (
					<img src={shown} alt="" />
				) : (
					<span className="pb-picker__empty">
						<Icon name="image" size={26} strokeWidth={1.6} />
					</span>
				)}
			</button>
			<div className="pb-picker__info">
				<strong>{t(label)}</strong>
				<span>{file ? `${file.name} · ${t('not saved yet')}` : t(hint ?? 'JPG or PNG, up to 5 MB')}</span>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					<button type="button" className="pb-btn pb-btn--outline pb-btn--sm" onClick={() => inputRef.current?.click()}>
						<Icon name={shown ? 'edit' : 'image'} size={14} />
						{shown ? t('Change') : t('Choose photo')}
					</button>
					{file && (
						<button type="button" className="pb-btn pb-btn--danger pb-btn--sm" onClick={() => onChange(null)}>
							<Icon name="trash" size={14} />
							{t('Remove')}
						</button>
					)}
				</div>
			</div>
			<input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden onChange={pickHandler} />
		</div>
	);
};

export default ImagePicker;
