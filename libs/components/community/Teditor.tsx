import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { tr } from '../../i18n';
import { Editor } from '@toast-ui/react-editor';
import { getJwtToken } from '../../auth';
import { ARTICLE_CONTENT_MAX, ARTICLE_TITLE_MAX, REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import axios from 'axios';
import { T } from '../../types/common'; //@ts-ignore
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/i18n/ko-kr';
import { useMutation } from '@apollo/client';
import { CREATE_ARTICLE } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetTopSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

// the backend keeps articleContent between 3 and 250 characters, so the editor writes markdown (shorter than HTML)
const TuiEditor = () => {
	const editorRef = useRef<Editor>(null),
		token = getJwtToken(),
		router = useRouter();
	const [contentLength, setContentLength] = useState<number>(0);
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	const [createArticle] = useMutation(CREATE_ARTICLE);

	const memorizedValues = useMemo(() => {
		const articleTitle = '',
			articleContent = '',
			articleImage = '';

		return { articleTitle, articleContent, articleImage };
	}, []);

	/** HANDLERS **/

	const uploadImage = async (image: any) => {
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target)
				  }`,
					variables: {
						file: null,
						target: 'article',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			memorizedValues.articleImage = responseImage;

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			console.log('Error, uploadImage:', err);
		}
	};

	const articleTitleHandler = (e: T) => {
		memorizedValues.articleTitle = e.target.value;
	};

	const contentChangeHandler = () => {
		const markdown = editorRef.current?.getInstance().getMarkdown() ?? '';
		setContentLength(markdown.trim().length);
	};

	const handleRegisterButton = async () => {
		try {
			const articleContent = (editorRef.current?.getInstance().getMarkdown() ?? '').trim();
			const articleTitle = memorizedValues.articleTitle.trim();

			if (!articleContent || !articleTitle) throw new Error(Message.INSERT_ALL_INPUTS);
			if (articleTitle.length < 3) throw new Error('Title must be at least 3 characters');
			if (articleContent.length < 3) throw new Error('Content must be at least 3 characters');
			if (articleContent.length > ARTICLE_CONTENT_MAX)
				throw new Error(tr('Content must be at most {{max}} characters', { max: ARTICLE_CONTENT_MAX }));

			await createArticle({
				variables: {
					input: {
						articleTitle,
						articleContent,
						...(memorizedValues.articleImage && { articleImage: memorizedValues.articleImage }),
					},
				},
			});

			await sweetTopSuccessAlert('Article has been created successfully', 700);
			await router.push({
				pathname: '/mypage',
				query: { category: 'myArticles' },
			});
		} catch (err: any) {
			console.log(err);
			sweetErrorHandling(err).then();
		}
	};

	return (
		<div className="pb-editor" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
			<label className="pb-field">
				<span>{t('Title')}</span>
				<input
					className="pb-input"
					placeholder={t('e.g. 5 habits for a healthy heart')}
					maxLength={ARTICLE_TITLE_MAX}
					onChange={articleTitleHandler}
				/>
			</label>

			<div className="pb-field">
				<span>{t('Content')}</span>
				<Editor
					initialValue={''}
					placeholder={t('Type here')}
					// the editor toolbar has its own Korean texts; other languages use English
					language={router.locale === 'kr' ? 'ko-KR' : 'en-US'}
					previewStyle={'vertical'}
					height={'420px'}
					// @ts-ignore
					initialEditType={'markdown'}
					toolbarItems={[
						['heading', 'bold', 'italic', 'strike'],
						['image', 'link'],
						['ul', 'ol'],
					]}
					ref={editorRef}
					onChange={contentChangeHandler}
					hooks={{
						addImageBlobHook: async (image: any, callback: any) => {
							const uploadedImageURL = await uploadImage(image);
							callback(uploadedImageURL);
							return false;
						},
					}}
				/>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
				<span
					style={{ fontSize: 13, color: contentLength > ARTICLE_CONTENT_MAX ? 'var(--pb-danger)' : 'var(--pb-muted)' }}
				>
					{contentLength} / {ARTICLE_CONTENT_MAX}
				</span>
				<button type="button" className="pb-btn pb-btn--primary" onClick={handleRegisterButton}>
					{t('Publish')}
				</button>
			</div>
		</div>
	);
};

export default TuiEditor;
