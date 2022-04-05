import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Post from '../../components/Post/Post';
import {
	AppContext,
	commentInterface,
	postInterface,
} from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import './SinglePost.css';
import SingleComment from '../../components/SingleComment/SingleComment';
import SearchField from '../../components/SearchField/SearchField';

const SinglePost = () => {
	const { user, posts, addComment, addFirstComment } = useContext(AppContext);
	const [solution, setSolution] = useState<string>('');
	const [filteredPost, setFilteredPost] = useState<postInterface[]>([]);
	const navigate = useNavigate();
	const { postId } = useParams();

	const handleBack = () => {
		navigate(-1);
	};
	useEffect(() => {
		setFilteredPost(posts.filter((post) => post.id === postId));
		return () => {
			setFilteredPost(posts);
		};
	}, [posts, postId]);

	const handleClick = () => {
		if (!user) {
			navigate('/login');
			return;
		}

		if (solution === '') {
			toast.error('Please add text!');
			return;
		}
		const newComment: commentInterface = {
			id: uuidv4(),
			authorEmail: user?.email as string,
			content: solution,
			votes: 0,
		};
		if (filteredPost[0]?.data?.comments?.length) {
			addComment(filteredPost[0]?.id, newComment);
		} else {
			addFirstComment(filteredPost[0]?.id, newComment);
		}
		setSolution('');
	};

	return (
		<div className='singlePostPage'>
			<div className='nested-navbar'>
				<Button onClick={handleBack}>Go Back</Button>
			</div>
			<div>
				<Post
					id={filteredPost[0]?.id}
					authorEmail={filteredPost[0]?.data?.authorEmail}
					heading={filteredPost[0]?.data?.heading}
					content={filteredPost[0]?.data?.content}
					tags={filteredPost[0]?.data?.tags}
					votes={filteredPost[0]?.data?.votes}
					singlePage={true}></Post>
			</div>
			<div>
				<SearchField
					inputText={solution}
					setInputText={setSolution}
					label='Add Solution'
					handleClick={handleClick}
					buttonText={'Add'}
				/>
			</div>
			<div>
				{filteredPost[0]?.data?.comments
					? filteredPost[0]?.data?.comments.map(
							(comment: commentInterface) => (
								<SingleComment
									key={comment.id}
									id={comment.id}
									authorEmail={comment.authorEmail}
									content={comment.content}
									votes={comment.votes}
								/>
							)
					  )
					: 'No solutions found!'}
			</div>
		</div>
	);
};

export default SinglePost;
