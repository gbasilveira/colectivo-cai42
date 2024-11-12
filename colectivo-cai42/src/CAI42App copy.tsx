import { useState, useEffect } from 'react';
import React from 'react';
import { PlusCircle, Trash2, Image, FileText, AlignLeft, ChevronRight, ChevronDown, X, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from './components/ui/alert';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    getDocs
} from 'firebase/firestore';

// Firebase config
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
const db = getFirestore(app);

// Field type enum
const FieldType = {
    TEXT: 'text',
    IMAGE: 'image',
    DOCUMENT: 'document'
};

const ImagePreview = ({ src, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-4">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
                <X size={24} />
            </button>
            <img src={src} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
        </div>
    </div>
);

const CommentSection = ({ itemId, comments, onAddComment }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(itemId, newComment);
            setNewComment('');
        }
    };

    return (
        <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MessageSquare size={16} />
                Comments ({comments?.length || 0})
            </h4>
            <div className="space-y-2 mb-4">
                {comments?.map((comment, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                        <div className="text-gray-600 text-xs">
                            {new Date(comment.timestamp).toLocaleString()}
                        </div>
                        {comment.text}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-2 border rounded text-sm"
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                >
                    Add
                </button>
            </form>
        </div>
    );
};

const CAI42App = () => {
    const [sections, setSections] = useState([]);
    const [newSection, setNewSection] = useState({ name: '', emoji: '', parent: null });
    const [newItem, setNewItem] = useState({
        field1: '',
        field2: '',
        field3: '',
        field3Type: FieldType.TEXT
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [expandedSections, setExpandedSections] = useState(new Set());
    const [lastSync, setLastSync] = useState(null);
    const [syncWarning, setSyncWarning] = useState(false);

    // Subscribe to Firestore updates
    useEffect(() => {
        const sectionsRef = collection(db, 'sections');
        const q = query(sectionsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sectionsData: any[] = [];
            snapshot.forEach((doc) => {
                sectionsData.push({ id: doc.id, ...doc.data() });
            });
            setSections(sectionsData);
            setLastSync(new Date());
        });

        // Check sync status every minute
        const syncInterval = setInterval(() => {
            if (lastSync) {
                const now = new Date() 
                const timeSinceSync: number = now.getTime() - lastSync.getTime();
                setSyncWarning(timeSinceSync > 5 * 60 * 1000); // Warning if no sync for 5 minutes
            }
        }, 60000);

        return () => {
            unsubscribe();
            clearInterval(syncInterval);
        };
    }, []);

    const saveToFirestore = async (data) => {
        try {
            const sectionsRef = collection(db, 'sections');
            await setDoc(doc(sectionsRef), {
                ...data,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving to Firestore:', error);
        }
    };

    const addComment = async (itemId, commentText) => {
        const newComment = {
            text: commentText,
            timestamp: new Date().toISOString()
        };

        setSections(prevSections => {
            const updateSectionsRecursively = (sections) => {
                return sections.map(section => {
                    const updatedItems = section.items.map(item => {
                        if (item.id === itemId) {
                            return {
                                ...item,
                                comments: [...(item.comments || []), newComment]
                            };
                        }
                        return item;
                    });

                    return {
                        ...section,
                        items: updatedItems,
                        subSections: section.subSections ? updateSectionsRecursively(section.subSections) : []
                    };
                });
            };

            const updatedSections = updateSectionsRecursively(prevSections);
            saveToFirestore({ sections: updatedSections });
            return updatedSections;
        });
    };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target && event.target.result) {
                    setNewItem(prev => ({
                        ...prev,
                        field3: event.target.result
                    }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };


    const addSection = async (parentId = null) => {
        if (newSection.name.trim()) {
            const sectionId = `section-${Date.now()}`;
            const newSectionData = {
                ...newSection,
                id: sectionId,
                parentId,
                items: [],
                subSections: []
            };

            setSections(prevSections => {
                let updatedSections;
                if (!parentId) {
                    updatedSections = [...prevSections, newSectionData];
                } else {
                    const updateSectionsRecursively = (sections) => {
                        return sections.map(section => {
                            if (section.id === parentId) {
                                return {
                                    ...section,
                                    subSections: [...(section.subSections || []), newSectionData]
                                };
                            }
                            if (section.subSections) {
                                return {
                                    ...section,
                                    subSections: updateSectionsRecursively(section.subSections)
                                };
                            }
                            return section;
                        });
                    };
                    updatedSections = updateSectionsRecursively(prevSections);
                }

                saveToFirestore({ sections: updatedSections });
                return updatedSections;
            });

            setNewSection({ name: '', emoji: '', parent: null });
        }
    };


    const addItem = (sectionId) => {
        if (newItem.field1.trim() || newItem.field2.trim() || newItem.field3.trim()) {
            const itemId = `item-${Date.now()}`;

            setSections(prevSections => {
                const updateSectionsRecursively = (sections) => {
                    return sections.map(section => {
                        if (section.id === sectionId) {
                            return {
                                ...section,
                                items: [...section.items, { ...newItem, id: itemId }]
                            };
                        }
                        if (section.subSections) {
                            return {
                                ...section,
                                subSections: updateSectionsRecursively(section.subSections)
                            };
                        }
                        return section;
                    });
                };

                return updateSectionsRecursively(prevSections);
            });

            setNewItem({
                field1: '',
                field2: '',
                field3: '',
                field3Type: FieldType.TEXT
            });
        }
    };


    const deleteSection = (sectionId) => {
        setSections(prevSections => {
            const deleteSectionRecursively = (sections) => {
                return sections.filter(section => {
                    if (section.id === sectionId) {
                        return false;
                    }
                    if (section.subSections) {
                        section.subSections = deleteSectionRecursively(section.subSections);
                    }
                    return true;
                });
            };

            return deleteSectionRecursively(prevSections);
        });
    };

    const deleteItem = (sectionId, itemId) => {
        setSections(prevSections => {
            const updateSectionsRecursively = (sections) => {
                return sections.map(section => {
                    if (section.id === sectionId) {
                        return {
                            ...section,
                            items: section.items.filter(item => item.id !== itemId)
                        };
                    }
                    if (section.subSections) {
                        return {
                            ...section,
                            subSections: updateSectionsRecursively(section.subSections)
                        };
                    }
                    return section;
                });
            };

            return updateSectionsRecursively(prevSections);
        });
    };


    const renderSection = (section, level = 0) => {
        const isExpanded = expandedSections.has(section.id);

        return (
            <div key={section.id} className="bg-white rounded-lg p-6 shadow-md">
                <div
                    className="flex justify-between items-center mb-4 cursor-pointer"
                    onClick={() => toggleSection(section.id)}
                >
                    <div className="flex items-center">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <h2 className="text-2xl font-semibold ml-2">
                            {section.emoji} {section.name}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                addSection(section.id);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                            Add Subsection
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteSection(section.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <>
                        {/* Add New Item Form */}
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Field 1"
                                    className="p-2 border rounded w-full"
                                    value={newItem.field1}
                                    onChange={(e) => setNewItem({ ...newItem, field1: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Field 2"
                                    className="p-2 border rounded w-full"
                                    value={newItem.field2}
                                    onChange={(e) => setNewItem({ ...newItem, field2: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewItem({ ...newItem, field3Type: FieldType.TEXT })}
                                        className={`p-2 rounded ${newItem.field3Type === FieldType.TEXT ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                    >
                                        <AlignLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setNewItem({ ...newItem, field3Type: FieldType.IMAGE })}
                                        className={`p-2 rounded ${newItem.field3Type === FieldType.IMAGE ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                    >
                                        <Image size={20} />
                                    </button>
                                    <button
                                        onClick={() => setNewItem({ ...newItem, field3Type: FieldType.DOCUMENT })}
                                        className={`p-2 rounded ${newItem.field3Type === FieldType.DOCUMENT ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                    >
                                        <FileText size={20} />
                                    </button>
                                </div>

                                {newItem.field3Type === FieldType.TEXT && (
                                    <textarea
                                        placeholder="Field 3 (Text)"
                                        className="p-2 border rounded w-full"
                                        value={newItem.field3}
                                        onChange={(e) => setNewItem({ ...newItem, field3: e.target.value })}
                                    />
                                )}
                                {newItem.field3Type === FieldType.IMAGE && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full"
                                        onChange={handleImageUpload}
                                    />
                                )}
                                {newItem.field3Type === FieldType.DOCUMENT && (
                                    <textarea
                                        placeholder="Field 3 (Document Content)"
                                        className="p-2 border rounded w-full"
                                        value={newItem.field3}
                                        onChange={(e) => setNewItem({ ...newItem, field3: e.target.value })}
                                    />
                                )}
                            </div>

                            <button
                                onClick={() => addItem(section.id)}
                                className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                            >
                                <PlusCircle size={20} />
                                Add Item
                            </button>
                        </div>

                        {/* Items List with Comments */}
                        <div className="space-y-4">
                            {section.items.map((item) => (
                                <div key={item.id} className="border p-4 rounded">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-2 bg-gray-50 rounded">{item.field1}</div>
                                        <div className="p-2 bg-gray-50 rounded">{item.field2}</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded">
                                        {item.field3Type === FieldType.IMAGE ? (
                                            <div className="relative">
                                                <img
                                                    src={item.field3}
                                                    alt="Thumbnail"
                                                    className="max-h-32 cursor-pointer"
                                                    onClick={() => setSelectedImage(item.field3)}
                                                />
                                            </div>
                                        ) : (
                                            <div className={item.field3Type === FieldType.DOCUMENT ? 'font-mono text-sm' : ''}>
                                                {item.field3}
                                            </div>
                                        )}
                                    </div>
                                    <CommentSection
                                        itemId={item.id}
                                        comments={item.comments}
                                        onAddComment={addComment}
                                    />
                                    <button
                                        onClick={() => deleteItem(section.id, item.id)}
                                        className="mt-2 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>


                        {/* Render Subsections */}
                        {section.subSections?.length > 0 && (
                            <div className="mt-4 ml-4 space-y-4">
                                {section.subSections.map(subSection => renderSection(subSection, level + 1))}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Colectivo CAI42 Organizer</h1>
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${lastSync && !syncWarning ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-600">
                            {lastSync ? `Last synced: ${lastSync.toLocaleTimeString()}` : 'Not synced'}
                        </span>
                    </div>
                </div>

                {syncWarning && (
                    <Alert className="mb-4">
                        <AlertDescription>
                            Warning: Haven't received updates from the database for more than 5 minutes
                        </AlertDescription>
                    </Alert>
                )}

                {/* Add New Section Form */}
                <div className="bg-white rounded-lg p-6 mb-8 shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Add New Section</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Section Name"
                            className="flex-1 p-2 border rounded"
                            value={newSection.name}
                            onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Emoji"
                            className="w-24 p-2 border rounded"
                            value={newSection.emoji}
                            onChange={(e) => setNewSection({ ...newSection, emoji: e.target.value })}
                        />
                        <button
                            onClick={() => addSection()}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                        >
                            <PlusCircle size={20} />
                            Add Section
                        </button>
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {sections.map(section => renderSection(section))}
                </div>

                {/* Image Preview Modal */}
                {selectedImage && (
                    <ImagePreview
                        src={selectedImage}
                        onClose={() => setSelectedImage(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default CAI42App;