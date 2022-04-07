import {
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	User,
	UserCredential,
} from 'firebase/auth';
import {
	addDoc,
	deleteDoc,
	doc,
	DocumentData,
	getDocs,
	onSnapshot,
	QuerySnapshot,
	setDoc,
	updateDoc,
} from 'firebase/firestore';
import React, { createContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { postCollectionRef } from '../config/firebase.collections';
import auth, { db } from '../config/firebaseConfig';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

// typescript interfaces
export interface commentInterface {
	id: string;
	authorEmail: string;
	content: string;
	votes: number;
}

export interface postInterface {
	id: string;
	data: DocumentData;
}

export interface postDataInterface {
	authorEmail: string;
	heading: string;
	content: string;
	votes: number;
	tags: string[];
	comments?: commentInterface[];
}

interface sweetAlertInterface {
	id: string;
	title: string;
	text: string;
	icon: SweetAlertIcon;
	showCancelButton: boolean;
	confirmButtonColor: string;
	cancelButtonColor: string;
	confirmButtonText: string;
	msg: string[];
	onConfirm: (id: string) => void;
}

interface contextInterface {
	user: User | null;
	posts: postInterface[];
	signup: (email: string, password: string) => Promise<UserCredential>;
	login: (email: string, password: string) => Promise<UserCredential>;
	logout: () => Promise<void>;
	googleSignIn: () => Promise<UserCredential>;
	resetPassword: (email: string) => Promise<void>;
	getPosts: () => void;
	addPost: (data: postDataInterface) => void;
	updatePostContent: (id: string, content: string) => void;
	addFirstComment: (id: string, comment: commentInterface) => void;
	addComment: (id: string, comment: commentInterface) => void;
	deletePost: (id: string) => void;
	setPosts: React.Dispatch<React.SetStateAction<postInterface[]>>;
	votePost: (id: string, vote: boolean) => void;
	sweetAlert: ({
		title,
		text,
		icon,
		showCancelButton,
		confirmButtonColor,
		cancelButtonColor,
		confirmButtonText,
		msg,
	}: sweetAlertInterface) => void;
}

export const AppContext = createContext({} as contextInterface);

export default function AppProvider({
	children,
}: React.HTMLAttributes<Element>) {
	const [user, setUser] = useState<User | null>(null);
	const [posts, setPosts] = useState<postInterface[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		const unsubscribe = onSnapshot(
			postCollectionRef,
			(snapshot: QuerySnapshot<DocumentData>) =>
				setPosts(
					snapshot?.docs?.map((doc) => ({
						id: doc.id,
						data: doc.data(),
					}))
				)
		);
		return () => {
			unsubscribe();
			setPosts([]);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// auth functions
	function signup(email: string, password: string) {
		return createUserWithEmailAndPassword(auth, email, password);
	}
	function login(email: string, password: string) {
		return signInWithEmailAndPassword(auth, email, password);
	}
	function logout() {
		return signOut(auth);
	}
	function googleSignIn() {
		const googleAuthProvider = new GoogleAuthProvider();
		return signInWithPopup(auth, googleAuthProvider);
	}
	function resetPassword(email: string) {
		return sendPasswordResetEmail(auth, email);
	}
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
			// console.log(user);
			setUser(user);
		});
		return () => {
			unsubscribe();
		};
	}, []);

	// post database functions
	function getPosts() {
		getDocs(postCollectionRef)
			.then((res) =>
				res?.docs?.map((doc) => ({ id: doc.id, data: doc.data() }))
			)
			.then((postsList) => setPosts(postsList))
			.catch((err) => toast.error(err.message));
	}
	function addPost(post: postDataInterface) {
		addDoc(postCollectionRef, post)
			.then(() => toast.success('Posted successfully!'))
			.catch((err) => toast.error(err.message));
	}
	function updatePostContent(id: string, content: string) {
		const docRef = doc(db, 'posts', id);
		updateDoc(docRef, { content }).catch((err) =>
			console.log((err as Error).message)
		);
	}
	function votePost(id: string, vote: boolean) {
		const docRef = doc(db, 'posts', id);
		const reqPost = posts.filter((post) => post.id === id);
		const updatedVotes = reqPost[0]?.data?.votes + (vote ? 1 : -1);
		updateDoc(docRef, { votes: updatedVotes }).catch((err) =>
			toast.error((err as Error).message)
		);
	}
	// function upvoteComment(id:string, post: postDataInterface, vote: boolean) {
	// 	const reqComment = post?.comments?.filter(
	// 		(comment: commentInterface) => comment.id === id
	// 	);
	// 	const updatedVotes = reqComment[0]?.votes + (vote ? 1 : -1);
	// 	const updatedComment = { ...reqComment, votes: updatedVotes };
	// 	updateDoc(docRef, {comments:[{id: id, votes: updatedVotes}]).catch((err) =>
	// 		console.log((err as Error).message)
	// 	);
	// }
	function addFirstComment(id: string, comment: commentInterface) {
		const docRef = doc(db, 'posts', id);
		const reqPost = posts.filter((post) => post.id === id);
		const updatedPost = { ...reqPost[0].data, comments: [comment] };
		console.log(updatedPost);
		setDoc(docRef, updatedPost)
			.then(() => toast.success('Added Comment!'))
			.catch((err) => toast.error((err as Error).message));
	}
	function addComment(id: string, comment: commentInterface) {
		const docRef = doc(db, 'posts', id);
		const reqPost = posts.filter((post) => post.id === id);
		const updatedComments: string[] = [
			...reqPost[0].data.comments,
			comment,
		];
		updateDoc(docRef, { comments: updatedComments })
			.then(() => toast.success('Added Comment!'))
			.catch((err) => toast.error((err as Error).message));
	}
	function deletePost(id: string) {
		const docRef = doc(db, 'posts', id);
		deleteDoc(docRef)
			.then(() => {
				navigate('/questions');
			})
			.catch((err) => toast.error((err as Error).message));
	}

	function sweetAlert({
		id,
		title,
		text,
		icon,
		showCancelButton,
		confirmButtonColor,
		cancelButtonColor,
		confirmButtonText,
		msg,
		onConfirm,
	}: sweetAlertInterface) {
		Swal.fire({
			title,
			text,
			icon,
			showCancelButton,
			confirmButtonColor,
			cancelButtonColor,
			confirmButtonText,
		})
			.then((result) => {
				if (result?.isConfirmed) {
					try {
						onConfirm(id);
						Swal.fire(...msg);
					} catch (err) {
						toast.error((err as Error).message);
					}
				}
			})
			.catch((err) => toast.error(err.message));
	}

	const value: contextInterface = {
		user,
		posts,
		signup,
		login,
		logout,
		googleSignIn,
		resetPassword,
		getPosts,
		addPost,
		updatePostContent,
		addFirstComment,
		addComment,
		deletePost,
		setPosts,
		votePost,
		sweetAlert,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
