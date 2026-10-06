import React, { useEffect, useRef, useState } from 'react';
import { Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import Icon from './Icon';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_MB = 5;

interface ImagePickerProps {
	file: File | null;
	onChange: (file: File | null) => void;
	label: string;
	hint?: string;
	// round for a person, wide for a clinic cover
	shape?: 'round' | 'wide';
}

// picks an image and shows a local preview; nothing is uploaded until the form is saved
const ImagePicker = ({ file, onChange, label, hint, shape = 'round' }: ImagePickerProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | null>(null);

	useEffect(() => {
		if (!file) return setPreview(null);
		const url = URL.createObjectURL(file);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const pickHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const picked = e.target.files?.[0];
		e.target.value = '';
		if (!picked) return;
		if (!ALLOWED.includes(picked.type)) return sweetMixinErrorAlert(Messages.error5);
		if (picked.size > MAX_MB * 1024 * 1024) return sweetMixinErrorAlert(`Image must be smaller than ${MAX_MB} MB`);
		onChange(picked);
	};

	return (
		<div className={`pb-picker pb-picker--${shape}`}>
			<button type="button" className="pb-picker__frame" onClick={() => inputRef.current?.click()} aria-label={preview ? `Change ${label}` : `Choose ${label}`}>
				{preview ? (
					<img src={preview} alt="" />
				) : (
					<span className="pb-picker__empty">
						<Icon name="image" size={26} strokeWidth={1.6} />
					</span>
				)}
			</button>
			<div className="pb-picker__info">
				<strong>{label}</strong>
				<span>{file ? file.name : hint ?? 'JPG or PNG, up to 5 MB'}</span>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					<button type="button" className="pb-btn pb-btn--outline pb-btn--sm" onClick={() => inputRef.current?.click()}>
						<Icon name={file ? 'edit' : 'image'} size={14} />
						{file ? 'Change' : 'Choose photo'}
					</button>
					{file && (
						<button type="button" className="pb-btn pb-btn--danger pb-btn--sm" onClick={() => onChange(null)}>
							<Icon name="trash" size={14} />
							Remove
						</button>
					)}
				</div>
			</div>
			<input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden onChange={pickHandler} />
		</div>
	);
};

export default ImagePicker;
