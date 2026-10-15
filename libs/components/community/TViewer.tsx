import React, { useEffect, useState } from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Viewer } from '@toast-ui/react-editor';
import { EcgLine } from '../ui/Loaders';
import { REACT_APP_API_URL } from '../../config';

// articles keep the full image address they were written with (e.g. http://localhost:3007/uploads/...);
// uploaded images always load from the current API, so an older host or a later domain change does not break them
const withApiImages = (markdown: string) =>
	markdown.replace(/\]\((?:https?:\/\/[^)\s/]+)?\/?(uploads\/[^)\s]+)\)/g, (_, path) => `](${REACT_APP_API_URL}/${path})`);

const TViewer = (props: any) => {
	const [editorLoaded, setEditorLoaded] = useState(false);

	/** LIFECYCLES **/
	useEffect(() => {
		if (props.markdown) {
			setEditorLoaded(true);
		} else {
			setEditorLoaded(false);
		}
	}, [props.markdown]);

	return (
		<div className="pb-viewer">
				{editorLoaded ? (
					<Viewer
						initialValue={withApiImages(props.markdown)}
						customHTMLRenderer={{
							htmlBlock: {
								iframe(node: any) {
									return [
										{
											type: 'openTag',
											tagName: 'iframe',
											outerNewLine: true,
											attributes: node.attrs,
										},
										{ type: 'html', content: node.childrenHTML ?? '' },
										{ type: 'closeTag', tagName: 'iframe', outerNewLine: true },
									];
								},
								div(node: any) {
									return [
										{ type: 'openTag', tagName: 'div', outerNewLine: true, attributes: node.attrs },
										{ type: 'html', content: node.childrenHTML ?? '' },
										{ type: 'closeTag', tagName: 'div', outerNewLine: true },
									];
								},
							},
							htmlInline: {
								big(node: any, { entering }: any) {
									return entering
										? { type: 'openTag', tagName: 'big', attributes: node.attrs }
										: { type: 'closeTag', tagName: 'big' };
								},
							},
						}}
					/>
				) : (
					<EcgLine />
				)}
		</div>
	);
};

export default TViewer;
