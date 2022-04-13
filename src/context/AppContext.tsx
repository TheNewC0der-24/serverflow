import {
	createUserWithEmailAndPassword,
	GoogleAuthProvider,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	User,
} from 'firebase/auth';
import {
	addDoc,
	deleteDoc,
	deleteField,
	doc,
	DocumentData,
	getDocs,
	increment,
	onSnapshot,
	QuerySnapshot,
	setDoc,
	updateDoc,
} from 'firebase/firestore';
import React, { createContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { postCollectionRef } from '../config/firebase.collections';
import auth, { db } from '../config/firebaseConfig';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import {
	commentInterface,
	contextInterface,
	postDataInterface,
	postInterface,
	sweetAlertCommentWarningInterface,
	sweetAlertPostWarningInterface,
} from '../database';

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
			setUser(user);
		});
		return () => {
			unsubscribe();
		};
	}, []);

	// posts collection functionalities
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
	function updatePostContent(postId: string, content: string) {
		const docRef = doc(db, 'posts', postId);
		updateDoc(docRef, { content }).catch((err) =>
			toast.error((err as Error).message)
		);
	}
	function votePost(postId: string, vote: number) {
		const docRef = doc(db, 'posts', postId);
		updateDoc(docRef, { votes: increment(vote) }).catch((err) =>
			toast.error((err as Error).message)
		);
	}
	function deletePost({
		postId,
		pathname,
	}: {
		postId: string;
		pathname: string;
	}) {
		const docRef = doc(db, 'posts', postId);
		deleteDoc(docRef)
			.then(() => {
				navigate(pathname);
			})
			.catch((err) => toast.error((err as Error).message));
		deleteAllComments(postId);
	}

	// comments collection functionalities
	function addComment(postId: string, comment: commentInterface) {
		const docRef = doc(db, `comments/${postId}`);
		setDoc(docRef, { [comment.id]: comment }, { merge: true })
			.then(() => toast.success('Added Comment!'))
			.catch((err) => toast.error((err as Error).message));
	}
	function voteComment(commentId: string, postId: string, vote: number) {
		const docRef = doc(db, 'comments', postId);
		updateDoc(docRef, {
			[`${commentId}.votes`]: increment(vote),
		}).catch((err) => toast.error((err as Error).message));
	}
	function deleteAllComments(postId: string) {
		const docRef = doc(db, `comments`, postId);
		deleteDoc(docRef).catch((err) => toast.error((err as Error).message));
	}
	function deleteSpecificComment(postId: string, commentId: string) {
		const docRef = doc(db, `comments`, postId);
		updateDoc(docRef, { [commentId]: deleteField() }).catch((err) =>
			toast.error((err as Error).message)
		);
	}

	function sweetAlertPostWarning({
		postId,
		pathname,
		title = 'Are you sure?',
		text = "You won't be able to revert this!",
		icon = 'warning',
		showCancelButton = true,
		confirmButtonColor = '#3085d6',
		cancelButtonColor = '#d33',
		confirmButtonText = 'Yes, delete it!',
		msg = ['Deleted!', 'Your file has been deleted.', 'success'],
	}: sweetAlertPostWarningInterface) {
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
						deletePost({ postId, pathname });
						Swal.fire(...msg);
					} catch (err) {
						toast.error((err as Error).message);
					}
				}
			})
			.catch((err) => toast.error(err.message));
	}
	function sweetAlertCommentWarning({
		postId,
		commentId,
		title = 'Are you sure?',
		text = "You won't be able to revert this!",
		icon = 'warning',
		showCancelButton = true,
		confirmButtonColor = '#3085d6',
		cancelButtonColor = '#d33',
		confirmButtonText = 'Yes, delete it!',
		msg = ['Deleted!', 'Your file has been deleted.', 'success'],
	}: sweetAlertCommentWarningInterface) {
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
						deleteSpecificComment(postId, commentId);
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
		addComment,
		deletePost,
		setPosts,
		votePost,
		voteComment,
		deleteSpecificComment,
		sweetAlertPostWarning,
		sweetAlertCommentWarning,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
