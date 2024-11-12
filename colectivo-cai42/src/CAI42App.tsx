import React from "react";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { collection, getFirestore, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { useState, useCallback } from "react";
import { useEffect } from "react";
import { PlusIcon, PencilIcon, TrashIcon, ArrowTurnDownRightIcon } from '@heroicons/react/24/outline';
import { ChangeEvent } from "react";
import { FormEvent } from "react";
import { enableIndexedDbPersistence } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAOUDQih2K3ntds9Nsvs68tkQ4LvNszc84",
  authDomain: "tyrso-99f16.firebaseapp.com",
  projectId: "tyrso-99f16",
  storageBucket: "tyrso-99f16.firebasestorage.app",
  messagingSenderId: "95703740641",
  appId: "1:95703740641:web:959c39d80d1f376cd847a0",
  measurementId: "G-QBYLDXF042"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
/*
    features:
    - infinite hierarchical tree view of categories and subcategories [which are categories themselves with parent/child relationships] and items [which are items themselves with parent/child relationships]
    - items have a name, field2 and description/image [thumbnail]
    - items can be added, modified, deleted
    - categories can be added, modified, deleted
    - subcategories can be added, modified, deleted
    - Items can be commented on

    The app is built with react, typescript, and shadcn/ui.

    The database is firestore.

    data structure:
    - categories / subcategories 
    - items
    - comments
    
*/

//types
type Category = {
    name: string;
    parent: string;
    emoji: string;
    lastUpdated?: Timestamp;
}

type Subcategory = Category & {
    parent: string;
}

type Item = {
    name: string;
    field2: string;
    description: string;
    picture: string;
    parent: string;
}

type Comment = {
    text: string;
    parent: string;
}



const categoriesCollection = collection(db, 'categories');
const subcategoriesCollection = collection(db, 'subcategories');
const itemsCollection = collection(db, 'items');
const commentsCollection = collection(db, 'comments');

// get all categories
const getCategories = async () => {
    const snapshot = await getDocs(categoriesCollection);
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    }));
}

// get all subcategories
const getSubcategories = async () => {
    const snapshot = await getDocs(subcategoriesCollection);
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    }));
}

// get all items
const getItems = async () => {
    const snapshot = await getDocs(itemsCollection);
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    }));
}

// get all comments
const getComments = async () => {
    const snapshot = await getDocs(commentsCollection);
    return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
    }));
}


// get all data
const getAllData = async () => {
    const categories = await getCategories();
    const subcategories = await getSubcategories();
    const items = await getItems();
    const comments = await getComments();
    return { categories, subcategories, items, comments };
}

// Add CRUD operations for categories
const addCategory = async (category: Omit<Category, 'lastUpdated'>) => {
    return await addDoc(categoriesCollection, {
        ...category,
        lastUpdated: serverTimestamp()
    });
}

const updateCategory = async (id: string, category: Partial<Category>) => {
  const docRef = doc(db, 'categories', id);
  return await updateDoc(docRef, category);
}

const deleteCategory = async (id: string) => {
  const docRef = doc(db, 'categories', id);
  return await deleteDoc(docRef);
}

// Add CRUD operations for subcategories
const addSubcategory = async (subcategory: Subcategory) => {
  return await addDoc(subcategoriesCollection, subcategory);
}

const updateSubcategory = async (id: string, subcategory: Partial<Subcategory>) => {
  const docRef = doc(db, 'subcategories', id);
  return await updateDoc(docRef, subcategory);
}

const deleteSubcategory = async (id: string) => {
  const docRef = doc(db, 'subcategories', id);
  return await deleteDoc(docRef);
}

// Add CRUD operations for items
const addItem = async (item: Item) => {
  return await addDoc(itemsCollection, item);
}

const updateItem = async (id: string, item: Partial<Item>) => {
  const docRef = doc(db, 'items', id);
  return await updateDoc(docRef, item);
}

const deleteItem = async (id: string) => {
  const docRef = doc(db, 'items', id);
  return await deleteDoc(docRef);
}

// Add CRUD operations for comments
const addComment = async (comment: Comment) => {
  return await addDoc(commentsCollection, comment);
}

const updateComment = async (id: string, comment: Partial<Comment>) => {
  const docRef = doc(db, 'comments', id);
  return await updateDoc(docRef, comment);
}

const deleteComment = async (id: string) => {
  const docRef = doc(db, 'comments', id);
  return await deleteDoc(docRef);
}

// Add search functionality
const searchItems = async (searchTerm: string) => {
  const nameQuery = query(itemsCollection, where("name", ">=", searchTerm), where("name", "<=", searchTerm + '\uf8ff'));
  const descQuery = query(itemsCollection, where("description", ">=", searchTerm), where("description", "<=", searchTerm + '\uf8ff'));
  const field2Query = query(itemsCollection, where("field2", ">=", searchTerm), where("field2", "<=", searchTerm + '\uf8ff'));

  const [nameResults, descResults, field2Results] = await Promise.all([
    getDocs(nameQuery),
    getDocs(descQuery),
    getDocs(field2Query)
  ]);

  const results = new Set([
    ...nameResults.docs,
    ...descResults.docs,
    ...field2Results.docs
  ].map(doc => ({ id: doc.id, ...doc.data() })));

  return Array.from(results);
}

const searchComments = async (searchTerm: string) => {
  const q = query(commentsCollection, where("text", ">=", searchTerm), where("text", "<=", searchTerm + '\uf8ff'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update the useCAI42App hook to include all operations
const useCAI42App = () => {
    const [data, setData] = useState<any>(null);
    const [lastUpdate, setLastUpdate] = useState<Timestamp | null>(null);

    // Set up real-time listeners
    useEffect(() => {
        const unsubscribeCategories = onSnapshot(categoriesCollection, (snapshot: any) => {
            snapshot.docChanges().forEach((change: any) => {
                if (change.type === "modified" || change.type === "added") {
                    const data = change.doc.data();
                    if (lastUpdate && data.lastUpdated && data.lastUpdated > lastUpdate) {
                        // Show notification to user
                        // alert(`Category "${data.name}" was updated`);
                        updateData();
                    }
                }
            });
        });

        // Similar listeners for other collections
        const unsubscribeItems = onSnapshot(itemsCollection, (snapshot: any) => {
            snapshot.docChanges().forEach((change: any) => {
                if (change.type === "modified" || change.type === "added") {
                    const data = change.doc.data();
                    if (lastUpdate && data.lastUpdated && data.lastUpdated > lastUpdate) {
                        alert(`Item "${data.name}" was updated`);
                        updateData();
                    }
                }
            });
        });

        return () => {
            unsubscribeCategories();
            unsubscribeItems();
            // Unsubscribe from other listeners
        };
    }, [lastUpdate]);

    const updateData = async () => {
        const data = await getAllData();
        setData(data);
        setLastUpdate(Timestamp.now());
    }

    return { 
        data, 
        updateData,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        addItem,
        updateItem,
        deleteItem,
        addComment,
        updateComment,
        deleteComment,
        searchItems,
        searchComments
    };
}

// Custom hook to handle loading and error states
const useLoadingError = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const startLoading = () => setIsLoading(true);
    const stopLoading = () => setIsLoading(false);
    const setErrorState = (err: Error | null) => setError(err);
    const clearError = () => setError(null);

    return {
        isLoading,
        error,
        startLoading,
        stopLoading,
        setErrorState,
        clearError
    };
};

// Wrap the data fetching hook with loading and error handling
const useDataWithLoadingState = () => {
    const {
        isLoading,
        error,
        startLoading,
        stopLoading,
        setErrorState,
        clearError
    } = useLoadingError();

    const {
        data,
        updateData,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        addItem,
        updateItem,
        deleteItem,
        addComment,
        updateComment,
        deleteComment,
        searchItems,
        searchComments
    } = useCAI42App();

    // Wrap each operation with loading and error handling
    const wrapOperation = async (operation: Function, ...args: any[]) => {
        try {
            startLoading();
            clearError();
            const result = await operation(...args);
            return result;
        } catch (err) {
            setErrorState(err instanceof Error ? err : new Error('An error occurred'));
            throw err;
        } finally {
            stopLoading();
        }
    };

    return {
        data,
        isLoading,
        error,
        updateData: () => wrapOperation(updateData),
        addCategory: (...args: Parameters<typeof addCategory>) => wrapOperation(addCategory, ...args),
        updateCategory: (...args: Parameters<typeof updateCategory>) => wrapOperation(updateCategory, ...args),
        deleteCategory: (...args: Parameters<typeof deleteCategory>) => wrapOperation(deleteCategory, ...args),
        addSubcategory: (...args: Parameters<typeof addSubcategory>) => wrapOperation(addSubcategory, ...args),
        updateSubcategory: (...args: Parameters<typeof updateSubcategory>) => wrapOperation(updateSubcategory, ...args),
        deleteSubcategory: (...args: Parameters<typeof deleteSubcategory>) => wrapOperation(deleteSubcategory, ...args),
        addItem: (...args: Parameters<typeof addItem>) => wrapOperation(addItem, ...args),
        updateItem: (...args: Parameters<typeof updateItem>) => wrapOperation(updateItem, ...args),
        deleteItem: (...args: Parameters<typeof deleteItem>) => wrapOperation(deleteItem, ...args),
        addComment: (...args: Parameters<typeof addComment>) => wrapOperation(addComment, ...args),
        updateComment: (...args: Parameters<typeof updateComment>) => wrapOperation(updateComment, ...args),
        deleteComment: (...args: Parameters<typeof deleteComment>) => wrapOperation(deleteComment, ...args),
        searchItems: (...args: Parameters<typeof searchItems>) => wrapOperation(searchItems, ...args),
        searchComments: (...args: Parameters<typeof searchComments>) => wrapOperation(searchComments, ...args)
    };
};


// Custom hook for managing loading and error states
const useLoadingAndError = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const startLoading = () => setIsLoading(true);
    const stopLoading = () => setIsLoading(false);
    const setErrorState = (err: Error) => setError(err);
    const clearError = () => setError(null);

    return {
        isLoading,
        error,
        startLoading,
        stopLoading,
        setErrorState,
        clearError
    };
};

// Input Components using shadcn/ui
const CategoryInput = ({ onSubmit }: { onSubmit: (data: Omit<Category, 'lastUpdated'>) => void }) => {
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState(() => {
        const emojis = ['🌟', '🎨', '🎭', '🎬', '📚', '🎵', '🎮', '🎪', '🎯', '🎲'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    });
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({ name, emoji, parent: '' });
        setName('');
        setEmoji('');
    };


    return (
        <div className="mb-8">
            {!showForm ? (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Nova Categoria
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-6">
                    <div className="flex gap-4">
                        <div className="w-20">
                            <input
                                id="emoji"
                                type="text"
                                value={emoji}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmoji(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                id="name"
                                type="text"
                                value={name}
                                placeholder="Category Name"
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 h-10 px-4 py-2"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2"
                        >
                            Adicionar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

const CommentInput = ({ onSubmit }: { onSubmit: (data: Comment) => void }) => {
    const [text, setText] = useState('');
    const [parent, setParent] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({ text, parent });
        setText('');
        setParent('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="commentText" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Comment
                </label>
                <textarea
                    id="commentText"
                    value={text}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="commentParent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Parent Item ID
                </label>
                <input
                    id="commentParent"
                    type="text"
                    value={parent}
                    onChange={(e: ChangeEvent<HTMLInputElement> ) => setParent(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                />
            </div>
            <button 
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
                Add Comment
            </button>
        </form>
    );
};

const InlineItemForm = ({ parentId, onSubmit, onCancel }: { 
    parentId: string, 
    onSubmit: (data: Item) => void,
    onCancel: () => void 
}) => {
    const [name, setName] = useState('');
    const [field2, setField2] = useState('');
    const [description, setDescription] = useState('');
    const [picture, setPicture] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({ name, field2, description, parent: parentId, picture });
        setName('');
        setField2('');
        setDescription('');
    };

    return (
        <form onSubmit={handleSubmit} className="pl-4 mt-2 mb-4">
            <div className="space-y-3 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                <input
                    type="text"
                    value={name}
                    placeholder="Title"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    required
                />
                <input
                    type="text"
                    value={field2}
                    placeholder="Subtitle"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setField2(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <textarea
                    value={description}
                    placeholder="Description"
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64String = reader.result as string;
                                setPicture(base64String);
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <div className="flex gap-2">
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                    >
                        Add Item
                    </button>
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
};

// Add this new component near the other UI components
const PictureOverlay = ({ picture, onClose }: { picture: string, onClose: () => void }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer"
            onClick={onClose}
        >
            <img 
                src={picture} 
                alt="" 
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e: any) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
        </div>
    );
};

// Update the RenderItem component to include the picture viewer
const RenderItem = ({ item, onUpdate }: { item: Item & {id: string}, onUpdate: () => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(item.name);
    const [editField2, setEditField2] = useState(item.field2);
    const [editDescription, setEditDescription] = useState(item.description);
    const [editPicture, setEditPicture] = useState(item.picture);
    const [showPicture, setShowPicture] = useState(false);
    const { updateItem, deleteItem, updateData } = useCAI42App();

    // Reset edit states when item prop changes
    useEffect(() => {
        setEditName(item.name);
        setEditField2(item.field2); 
        setEditDescription(item.description);
        setEditPicture(item.picture);
    }, [item]);

    const handleSave = async () => {
        try {
            await updateItem(item.id, {
                name: editName,
                field2: editField2,
                description: editDescription,
                picture: editPicture,
                parent: item.parent
            });
            await updateData();
            setIsEditing(false);
            onUpdate(); // Make sure this is being called
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    const handleCancel = () => {
        setEditName(item.name);
        setEditField2(item.field2);
        setEditDescription(item.description);
        setEditPicture(item.picture);
        setIsEditing(false);
    };

    const handleDeleteItem = async (id: string) => {
        await deleteItem(id);
        await updateData();
        onUpdate(); // Trigger parent rerender
    };

return (
    <div key={item.id} className="pl-4 py-2">
        {showPicture && item.picture && (
            <PictureOverlay 
                picture={item.picture} 
                onClose={() => setShowPicture(false)} 
            />
        )}
        <div className="p-3 bg-white/30 backdrop-blur-sm rounded-lg shadow-sm">
            {!isEditing ? (
                <div className="flex items-center gap-2">
                    <div className="flex gap-4 items-center">
                        {item.picture && (
                            <div 
                                className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setShowPicture(true)}
                            >
                                <img src={item.picture} alt="" className="w-full h-full object-cover"/>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-4">
                                <span className="font-bold">{item.name}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500 text-sm italic font-light">{item.field2}</span>
                            </div>
                            {item.description && (
                                <span className="text-gray-500 text-sm">{item.description}</span>
                            )}
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-sm text-blue-400 hover:text-blue-600 transition-colors"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <input
                        type="text"
                        value={editName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Name"
                    />
                    <input
                        type="text"
                        value={editField2}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditField2(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Field 2"
                    />
                    <textarea
                        value={editDescription}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Description"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setEditPicture(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
};

// Add this new component near the other UI components
const LoadingOverlay = () => {
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-gray-700">A actualizar...</span>
            </div>
        </div>
    );
};

// Add this component near the other form components
const InlineCategoryForm = ({ 
    category, 
    onSubmit, 
    onCancel 
}: { 
    category: Category & {id: string}, 
    onSubmit: (data: {name: string}) => void,
    onCancel: () => void 
}) => {
    const [name, setName] = useState(category.name);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({ name });
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={category.emoji}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onSubmit({...category, emoji: e.target.value})}
                    className="w-12 text-xl text-center px-2 py-1 border rounded-md mr-2"
                />
                <input
                    type="text"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                    autoFocus
                />
                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        className="p-2 text-sm text-green-500 hover:text-green-600 transition-colors"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 text-sm text-gray-500 hover:text-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
};

// Add this near the top of the file with other imports
const COLLAPSED_CATEGORIES_KEY = 'collapsedCategories';

// Update the getCollapsedCategories function
const getCollapsedCategories = (): string[] => {
    const stored = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
    if (stored) return JSON.parse(stored);
    
    // If no stored state, get all category IDs from the database
    const allCategories = getAllData().then(data => 
        data.categories.map((category: Category & {id: string}) => category.id)
    );
    
    return allCategories || [];
};

// Update the TreeView component to handle initial collapsed state
const TreeView = ({ onUpdate }: { onUpdate: () => void }) => {
    const { 
        data, 
        addCategory, 
        updateCategory, 
        deleteCategory, 
        addItem, 
        updateItem, 
        deleteItem,
        updateData
    } = useCAI42App();
    const { isLoading, error } = useLoadingAndError();
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddItem, setShowAddItem] = useState<string | null>(null); // Stores parent category ID
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);

    // Add this useEffect to set initial collapsed state after data is loaded
    useEffect(() => {
        if (data?.categories) {
            const categoryIds = data.categories.map((c: Category & {id: string}) => c.id);
            setCollapsedCategories(prev => {
                const stored = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
                return stored ? JSON.parse(stored) : categoryIds;
            });
        }
    }, [data?.categories]);

    const toggleCollapse = (categoryId: string) => {
        setCollapsedCategories(prev => {
            const newCollapsed = prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId];
            
            localStorage.setItem(COLLAPSED_CATEGORIES_KEY, JSON.stringify(newCollapsed));
            return newCollapsed;
        });
    };

    // Update the data fetching function
    const fetchData = async () => {
        try {
            setIsUpdating(true);
            await updateData();
        } finally {
            setIsUpdating(false);
        }
    };

    // Update useEffect to use the new fetchData function
    useEffect(() => {
        fetchData();
    }, []);

    // Wrap all operations that modify data with the loading state
    const wrapOperation = async (operation: Function, ...args: any[]) => {
        try {
            setIsUpdating(true);
            await operation(...args);
            await updateData();
            onUpdate();
        } finally {
            setIsUpdating(false);
        }
    };

    // Update all handlers to use wrapOperation
    const handleUpdateCategory = (id: string, newName: string) => 
        wrapOperation(updateCategory, id, { name: newName });

    const handleDeleteCategory = (id: string) => 
        wrapOperation(deleteCategory, id);

    const handleUpdateItem = (id: string, updates: Partial<Item>) => 
        wrapOperation(updateItem, id, updates);

    const handleAddItem = (item: Item) => 
        wrapOperation(addItem, item);

    const handleAddCategory = (category: Omit<Category, 'lastUpdated'>) => 
        wrapOperation(addCategory, category);

    if (isLoading) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Colectivo CAI42</h1>
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Colectivo CAI42</h1>
                <div className="text-red-500">Error: {error.message}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-3 py-2 bg-blue-500 text-white rounded"
                >
                    Retry
                </button>
            </div>
        );
    }

    const renderCategory = (category: Category & {id: string}) => {
        const isCollapsed = collapsedCategories.includes(category.id);
        const childCategories = data?.categories?.filter((c: Category) => c.parent === category.id) || [];
        const childItems = data?.items?.filter((i: Item) => i.parent === category.id) || [];
        const hasChildren = childCategories.length > 0 || childItems.length > 0;

        return (
            <div key={category.id} className="pl-4 mb-4">
                <div 
                    className={`flex items-center gap-2 py-2 px-3 bg-white/50 backdrop-blur-sm rounded-lg  ${hasChildren ? 'cursor-pointer shadow-sm' : ''}`}
                    onClick={(e) => {
                        // Prevent collapse toggle when clicking buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        if (hasChildren) toggleCollapse(category.id);
                    }}
                >
                    {isEditing === category.id ? (
                        <InlineCategoryForm
                            category={category}
                            onSubmit={async (data) => {
                                await handleUpdateCategory(category.id, data.name);
                                setIsEditing(false);
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <>
                            <div className={`flex items-center gap-2 flex-1 pb-2
                                    hover:opacity-80 transition-opacity
                                    ${hasChildren ? '' : ''} 
                                    ${isCollapsed ? 'opacity-50' : 'border-b border-gray-200 opacity-100'}
                                `}>
                                <span className="text-xl mr-2">{category.emoji}</span>
                                <span className="font-medium">{category.name}</span>
                            </div>
                            <div className="ml-auto flex items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddItem(category.id);
                                    }}
                                    className="p-2 text-sm text-green-500 hover:text-green-600 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(category.id);
                                    }}
                                    className="p-2 text-sm text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(category.id);
                                    }}
                                    className="p-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {!isCollapsed && (
                    <>
                        {showAddItem === category.id && (
                            <InlineItemForm 
                                parentId={category.id}
                                onSubmit={async (data: Item) => {
                                    await handleAddItem(data);
                                    setShowAddItem(null);
                                }}
                                onCancel={() => setShowAddItem(null)}
                            />
                        )}

                        {childCategories.map(renderCategory)}
                        
                        {childItems.map((item: Item & {id: string}) => (
                            <RenderItem key={item.id} item={item} onUpdate={onUpdate} />
                        ))}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto p-4 min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
            {isUpdating && <LoadingOverlay />}
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Colectivo CAI42</h1>
            
            <CategoryInput 
                onSubmit={async (data: Omit<Category, 'lastUpdated'>) => {
                    await handleAddCategory(data);
                }} 
            />
            
            {data?.categories
                ?.filter((c: Category) => !c.parent)
                .map(renderCategory)}
        </div>
    );
};






const CAI42App = () => {
    const [updateCounter, setUpdateCounter] = useState(0);
    const forceRerender = useCallback(() => {
        setUpdateCounter(prev => prev + 1);
    }, []);
    
    return <>
        <TreeView onUpdate={forceRerender} key={updateCounter} />
    </>;
}

export default CAI42App;



