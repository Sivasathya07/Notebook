import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Plus, Edit2, Trash2, BookOpen, X } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000/notes/';

function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  
  // Note Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(API_URL);
      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
    }
  };

  const handeSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      if (currentNote) {
        // Update Note
        await axios.put(`${API_URL}${currentNote.id}`, { title, content });
      } else {
        // Create Note
        await axios.post(API_URL, { title, content });
      }
      
      closeModal();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`${API_URL}${id}`);
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const openModal = (note = null) => {
    if (note) {
      setCurrentNote(note);
      setTitle(note.title);
      setContent(note.content);
    } else {
      setCurrentNote(null);
      setTitle('');
      setContent('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNote(null);
    setTitle('');
    setContent('');
  };

  return (
    <>
      <div className="header-container">
        <h1 className="app-title">Lumina Notes</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          New Note
        </button>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="glass-card empty-state">
          <BookOpen size={48} />
          <h3>No notes yet</h3>
          <p>Create your first note to get started.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className="glass-card note-card">
              <div className="note-header">
                <h3 className="note-title">{note.title}</h3>
                <div className="note-actions">
                  <button className="btn-icon" onClick={() => openModal(note)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => deleteNote(note.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="note-content">{note.content}</p>
              <div className="note-footer">
                <span>{moment(note.updated_at).format('MMM D, YYYY h:mm A')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>
                {currentNote ? 'Edit Note' : 'Create Note'}
              </h2>
              <button className="btn-icon" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handeSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-textarea"
                  placeholder="Write your thoughts here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!title.trim() || !content.trim()}>
                  {currentNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
