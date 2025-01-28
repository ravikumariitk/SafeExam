import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { initSocket } from '../socket';
import TakeQuiz from './TakeQuiz';
import PersonalResult from './PersonalResult';
import AnsKey from './AnsKey';
import GetAnsKey from './GetAnsKey';
import QuizForm from './Quiz';
import ClassResult from './ClassResult';
import ReleaseResult from './ReleaseResult';
import Response from './Response';
import HomePage from './HomePage';
import { useLocation } from "react-router-dom";
import toast from 'react-hot-toast'
import HomePageS from './HomePageS';

function Home() {
  const [current, setCurrent] = useState('home');
  const [roll, setRoll] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state.email;
  const [role, setRole] = useState('');
  const socketRef = useRef(null);
  const [data,setData] = useState();
  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error('Connection failed. Try again later.');
      }
    }

    init();
    setTimeout(() => {
      socketRef.current.emit('get-user-data', {
        email: email,
      });

      socketRef.current.on('get-user-data-response', ({ data }) => {
        if (data && data.length > 0) {
          setData(data[0]);
          console.log(data[0]);
          setRoll(data[0].roll);
          setRole(data[0].role);
        } else {
          toast.error('Something went worng');
          navigate('/');
        }
      });

      socketRef.current.on('get-user-data-failed', () => {
        toast.error('Something went wrong');
        navigate('/');
      });
    }, 1);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h1 style={styles.heading}>Quiz-App</h1>
        <div style={styles.linksContainer}>
          {role === 'Instructor' && (
            <>
            <button
                onClick={() => setCurrent('home')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Home
              </button>
              <button
                onClick={() => setCurrent('createquiz')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Create a Quiz
              </button>
              <button
                onClick={() => setCurrent('release-anskey')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Release Ans Key
              </button>
              <button
                onClick={() => setCurrent('class-result')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Class Result
              </button>
              <button
                onClick={() => setCurrent('get-response')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Class Response
              </button>
              <button
                onClick={() => setCurrent('release-result')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Release Result
              </button>
            </>
          )}
          {role === 'Student' && (
            <>
            <button
                onClick={() => setCurrent('home')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Home
              </button>
              <button
                onClick={() => setCurrent('takequiz')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Take a Quiz
              </button>
              <button
                onClick={() => setCurrent('result')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Result
              </button>
              <button
                onClick={() => setCurrent('get-anskey')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
                Get Ans Key
              </button>
            </>
          )}
           <button
                onClick={() => navigate('/signin')}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = styles.linkHover.backgroundColor
                  e.target.style.color = styles.linkHover.color
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = styles.link.backgroundColor
                  e.target.style.color = styles.link.color
                }}
              >
               Log Out
              </button>
        </div>
      </div>

      <div style={styles.contentArea}>
        {current === 'home' && role === 'Instructor' && <HomePage email={email} data={data}/>}
        {current === 'home' && role === 'Student' && <HomePageS email={email} data={data} role = {role}/>}
        {current === 'takequiz' && <TakeQuiz email={email} roll={roll} />}
        {current === 'result' && <PersonalResult email={email} />}
        {current === 'get-anskey' && <GetAnsKey />}
        {current === 'createquiz' && <QuizForm email={email} />}
        {current === 'release-anskey' && <AnsKey />}
        {current === 'get-response' && <Response />}
        {current === 'class-result' && <ClassResult />}
        {current === 'release-result' && <ReleaseResult />}
        <Outlet />
      </div>
    </div>
  );
}

const styles = {
  container: {
    top : '0px',
    display: 'flex',
    height: '94vh',
    width : '100vw',
    backgroundColor: '#f4f4f4',
  },
  sidebar: {
    top : '0px',
    width: '250px',
    backgroundColor: '#fff',
    borderRight: '1px solid #ddd',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '20px',
  },
  linksContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
  },
  link: {
    fontSize: '1rem',
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  },
  linkHover: {
    backgroundColor: 'black',
    color: 'white',
  },
  contentArea: {
    overflow: 'auto',
    flex: 1,
    padding: '20px',
    // backgroundColor: '#fff',
    borderRadius: '8px',
    // boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    // margin: '20px',
  },
};

export default Home;