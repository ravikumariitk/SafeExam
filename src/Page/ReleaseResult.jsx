import React, { useEffect, useRef, useState } from 'react';
import { initSocket } from '../socket';
import { toast } from 'react-toastify';

function ReleaseResult() {
  const socketRef = useRef(null);
  const [id, setId] = useState('');

  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error('Connection failed, try again later.');
      }
    }
    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  function handleSubmit() {
    const loadingToastId = toast.loading('Releasing Result...');
    socketRef.current.emit('release-result', { id: id });
    socketRef.current.on('release-result-success', (data) => {
      toast.success('Result Released!', { id: loadingToastId });
    })
    socketRef.current.on('release-result-failed',()=>{
      toast.error('Result Release Failed!', { id: loadingToast})
    })
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Release Result</h2>
      <br />
      <input
        type="text"
        style={styles.input}
        placeholder="Enter Quiz ID"
        onChange={(e) => setId(e.target.value)}
      />&nbsp; &nbsp;
      <button style={styles.button} onClick={handleSubmit}>
        Release Result
      </button>
    </div>
  );
}

const styles = {
  container: {
    width: '80%',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    // textAlign: 'center',
    color: '#333',
  },
  input: {
    padding: '8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '60%',
  },
  button: {
    backgroundColor: '#000',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default ReleaseResult;
