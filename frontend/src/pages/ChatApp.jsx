import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config';
import './ChatApp.css';

const ChatApp = ({ onShowProfile }) => {
    const { t } = useTranslation();
    const [matches, setMatches] = useState([]);
    const [activeMatch, setActiveMatch] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const { socket, currentUser } = useSocket();
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifSearch, setGifSearch] = useState('');
    const [gifs, setGifs] = useState([]);
    const [gifLoading, setGifLoading] = useState(false);
    const activeMatchRef = useRef(null);
    const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

    const [callerSignal, setCallerSignal] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [callType, setCallType] = useState("");
    const [callInProgress, setCallInProgress] = useState(false);
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerName, setCallerName] = useState("");

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const pendingCandidates = useRef([]);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        if (stream && myVideo.current) {
            myVideo.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (remoteStream && userVideo.current) {
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        activeMatchRef.current = activeMatch;
    }, [activeMatch]);

    useEffect(() => {
        if (!socket || !currentUser) return;
        socketRef.current = socket;

        const handleReceiveMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
            const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString();
            if (activeMatchRef.current?._id?.toString() === msgSenderId) {
                socket.emit('mark_read', { senderId: msgSenderId, receiverId: currentUser._id });
            }
        };
        const handleMessagesRead = () => {
            setMessages(prev => prev.map(m => {
                const mSenderId = m.sender?._id?.toString() || m.sender?.toString();
                return mSenderId === currentUser._id?.toString() ? { ...m, read: true } : m;
            }));
        };
        const handleMessageSent = (msg) => setMessages(prev => [...prev, msg]);
        const handleCallUser = (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setCallerName(data.name);
            setCallerSignal(data.signal);
            setCallType(data.callType);
        };
        const handleCallAccepted = async (signal) => {
            if (connectionRef.current && connectionRef.current.signalingState === "have-local-offer") {
                try {
                    setCallAccepted(true);
                    await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                    while (pendingCandidates.current.length > 0) {
                        const candidate = pendingCandidates.current.shift();
                        await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (e) {
                    console.error("Error setting remote description:", e);
                }
            } else {
                console.warn("handleCallAccepted: Connection not in have-local-offer state or already handled. State:", connectionRef.current?.signalingState);
            }
        };
        const handleIceCandidate = async (candidate) => {
            if (connectionRef.current && connectionRef.current.remoteDescription) {
                try {
                    await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ice candidate:", e);
                }
            } else {
                pendingCandidates.current.push(candidate);
            }
        };
        const handleCallEnded = () => cleanupCall();

        socket.on('receive_message', handleReceiveMessage);
        socket.on('message_sent', handleMessageSent);
        socket.on('messages_read', handleMessagesRead);
        socket.on('call_user', handleCallUser);
        socket.on('call_accepted', handleCallAccepted);
        socket.on('ice_candidate', handleIceCandidate);
        socket.on('call_ended', handleCallEnded);

        const fetchMatches = async () => {
            try {
                const matchesRes = await axios.get(`${API_URL}/api/users/matches`, { withCredentials: true });
                setMatches(matchesRes.data);
            } catch (err) {
                console.error('Failed to load matches:', err);
            }
        };
        fetchMatches();

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('message_sent', handleMessageSent);
            socket.off('messages_read', handleMessagesRead);
            socket.off('call_user', handleCallUser);
            socket.off('call_accepted', handleCallAccepted);
            socket.off('ice_candidate', handleIceCandidate);
            socket.off('call_ended', handleCallEnded);
        };
    }, [socket, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadChat = async (match) => {
        setActiveMatch(match);
        setShowGifPicker(false);
        try {
            const res = await axios.get(`${API_URL}/api/messages/history/${match._id}`, { withCredentials: true });
            setMessages(res.data);
            socketRef.current?.emit('mark_read', { senderId: match._id, receiverId: currentUser._id });
        } catch (err) {
            console.error('Error loading chat history:', err);
        }
    };

    const fetchGifs = async (query = '') => {
        if (!GIPHY_API_KEY) return;
        setGifLoading(true);
        try {
            const url = query
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=12&rating=g`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`;
            const res = await fetch(url);
            const json = await res.json();
            setGifs(json.data || []);
        } catch (err) {
            console.error('Error fetching GIFs:', err);
        } finally {
            setGifLoading(false);
        }
    };

    const sendGif = (gifUrl) => {
        if (!activeMatch || !currentUser) return;
        socketRef.current.emit('send_message', {
            senderId: currentUser._id,
            receiverId: activeMatch._id,
            content: gifUrl,
            type: 'gif',
        });
        setShowGifPicker(false);
        setGifs([]);
        setGifSearch('');
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start(1000); // Capture data every second
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioMessage = async () => {
        if (!audioBlob || !activeMatch || !currentUser) return;
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice-message.webm');
            const uploadRes = await axios.post(`${API_URL}/api/messages/upload-audio`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const messageData = {
                senderId: currentUser._id,
                receiverId: activeMatch._id,
                content: uploadRes.data.audioUrl,
                type: 'audio'
            };
            socketRef.current.emit('send_message', messageData);
            setAudioBlob(null);
        } catch (err) {
            console.error('Error uploading audio:', err);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeMatch || !currentUser) return;
        const messageData = {
            senderId: currentUser._id,
            receiverId: activeMatch._id,
            content: newMessage,
            type: 'text'
        };
        socketRef.current.emit('send_message', messageData);
        setNewMessage('');
    };

    const setupMediaStream = async (type) => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });
            setStream(mediaStream);
            return mediaStream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            return null;
        }
    };

    const callUser = async (type) => {
        if (!activeMatch || !currentUser || callInProgress) return;
        setCallInProgress(true);
        setCallType(type);
        const mediaStream = await setupMediaStream(type);
        if (!mediaStream) {
            setCallInProgress(false);
            return;
        }
        const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        connectionRef.current = peer;
        mediaStream.getTracks().forEach(track => peer.addTrack(track, mediaStream));
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice_candidate', { to: activeMatch._id, candidate: event.candidate });
            }
        };
        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('call_user', {
            userToCall: activeMatch._id,
            signalData: offer,
            from: currentUser._id,
            name: currentUser.firstName,
            callType: type
        });
    };

    const answerCall = async () => {
        if (callInProgress) return;
        setCallInProgress(true);
        setCallAccepted(true);
        const mediaStream = await setupMediaStream(callType);
        if (!mediaStream) {
            setCallInProgress(false);
            setCallAccepted(false);
            setReceivingCall(false);
            socketRef.current.emit('end_call', { to: caller });
            return;
        }
        const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        connectionRef.current = peer;
        mediaStream.getTracks().forEach(track => peer.addTrack(track, mediaStream));
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice_candidate', { to: caller, candidate: event.candidate });
            }
        };
        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };
        await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
        // Process queued candidates
        while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding queued candidate:", e);
            }
        }
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current.emit('answer_call', { signal: answer, to: caller });
        setReceivingCall(false);
    };

    const leaveCall = () => {
        socketRef.current.emit('end_call', { to: callAccepted ? (caller || activeMatch?._id) : (activeMatch?._id) });
        cleanupCall();
    };

    const cleanupCall = () => {
        setCallEnded(true);
        pendingCandidates.current = [];
        if (connectionRef.current) { connectionRef.current.close(); connectionRef.current = null; }
        if (stream) { stream.getTracks().forEach(track => track.stop()); }
        setStream(null);
        setRemoteStream(null);
        setCallAccepted(false);
        setReceivingCall(false);
        if (currentUser && (caller || activeMatch?._id)) {
            const targetId = caller || activeMatch?._id;
            const messageData = {
                senderId: currentUser._id,
                receiverId: targetId,
                content: callType,
                type: 'call'
            };
            socketRef.current.emit('send_message', messageData);
        }
        setCaller("");
        setCallerSignal(null);
        setCallEnded(false);
        setCallInProgress(false);
        if (myVideo.current) myVideo.current.srcObject = null;
        if (userVideo.current) userVideo.current.srcObject = null;
    };

    return (
        <div className="chat-app-container container">
            <div className="chat-layout">
                <div className="matches-sidebar">
                    <h3>{t('common.messages')}</h3>
                    <div className="matches-list">
                        {matches.length === 0 ? (
                            <p className="no-matches">{t('chat.emptyMatchList')}</p>
                        ) : (
                            matches.map(match => (
                                <div
                                    key={match._id}
                                    className={`match-item ${activeMatch?._id === match._id ? 'active' : ''}`}
                                    onClick={() => loadChat(match)}
                                >
                                    <div className="match-avatar bg-pink">
                                        {match.photos && match.photos.length > 0 ? (
                                            <img src={`${API_URL}${match.photos[0]}`} alt={match.firstName} />
                                        ) : (
                                            <span>{match.firstName[0]}</span>
                                        )}
                                    </div>
                                    <div className="match-name">{match.firstName}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="chat-area">
                    {activeMatch ? (
                        <>
                            <div className="chat-header">
                                <div className="active-match-info" onClick={() => onShowProfile(activeMatch._id)}>
                                    <div className="match-avatar-small bg-pink">
                                        {activeMatch.photos && activeMatch.photos.length > 0 ? (
                                            <img src={`${API_URL}${activeMatch.photos[0]}`} alt={activeMatch.firstName} />
                                        ) : (
                                            <span>{activeMatch.firstName[0]}</span>
                                        )}
                                    </div>
                                    <h4>{activeMatch.firstName}</h4>
                                </div>
                                <div className="header-actions">
                                    <button className="call-btn" disabled={callInProgress} onClick={() => callUser('audio')}>📞</button>
                                    <button className="call-btn" disabled={callInProgress} onClick={() => callUser('video')}>📹</button>
                                </div>
                            </div>

                            {/* Ongoing Call UI */}
                            {(stream || remoteStream) && !callEnded && (
                                <div className={`call-interface ${callType === 'video' ? 'video-mode' : 'audio-mode'}`}>
                                    {callType === 'video' ? (
                                        <div className="video-container">
                                            {stream && (
                                                <div className="video-box local">
                                                    <video playsInline muted ref={myVideo} autoPlay className="video-stream" />
                                                    <span className="video-label">{t('common.you')}</span>
                                                </div>
                                            )}
                                            {remoteStream && (
                                                <div className="video-box remote">
                                                    <video playsInline ref={userVideo} autoPlay className="video-stream" />
                                                    <span className="video-label">{activeMatch.firstName}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="audio-call-ui">
                                            <div className="audio-avatar pulse">
                                                {activeMatch.photos?.[0] ? (
                                                    <img src={`${API_URL}${activeMatch.photos[0]}`} alt={activeMatch.firstName} />
                                                ) : (
                                                    <span>{activeMatch.firstName[0]}</span>
                                                )}
                                            </div>
                                            <p>{t('chat.audioCall')}...</p>
                                            {/* Hidden video element to play remote audio in audio-only mode */}
                                            <video playsInline ref={userVideo} autoPlay style={{ display: 'none' }} />
                                        </div>
                                    )}

                                    <div className="call-controls">
                                        <button className="hangup-btn" onClick={leaveCall}>
                                            <span className="hangup-icon">📞</span>
                                            {t('chat.hangup')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="messages-container">
                                {messages.map((msg, idx) => {
                                    const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString();
                                    const isMine = msgSenderId === currentUser._id?.toString();
                                    const isCall = msg.type === 'call';
                                    const isAudio = msg.type === 'audio';
                                    const isGif = msg.type === 'gif';

                                    if (isCall) {
                                        return (
                                            <div key={idx} className="message-bubble message-call-bubble">
                                                <div className="call-log-content">
                                                    <span>{msg.content === 'video' ? '📹' : '📞'}</span>
                                                    <span>{msg.content === 'video' ? t('chat.videoCall') : t('chat.audioCall')} {t('chat.callEnded')}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={idx} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                                            <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${isAudio ? 'message-audio-bubble' : ''} ${isGif ? 'message-gif-bubble' : ''}`}>
                                                {isAudio ? (
                                                    <audio
                                                        src={msg.content.startsWith('http') ? msg.content : `${API_URL}${msg.content}`}
                                                        controls
                                                        className="audio-player"
                                                    />
                                                ) : isGif ? (
                                                    <img src={msg.content} alt="GIF" className="message-gif-img" />
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                            {isMine && (
                                                <span className={`read-receipt ${msg.read ? 'read' : ''}`}>
                                                    {msg.read ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input-wrapper">
                                {showGifPicker && (
                                    <div className="gif-picker">
                                        <div className="gif-search-bar">
                                            <input
                                                type="text"
                                                placeholder="Rechercher des GIFs..."
                                                value={gifSearch}
                                                onChange={(e) => setGifSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && fetchGifs(gifSearch)}
                                                className="input-base gif-search-input"
                                            />
                                            <button type="button" className="gif-search-btn" onClick={() => fetchGifs(gifSearch)}>🔍</button>
                                        </div>
                                        {!GIPHY_API_KEY ? (
                                            <div className="gif-no-key">
                                                <p>Ajoute <code>VITE_GIPHY_API_KEY</code> dans le fichier <code>frontend/.env</code></p>
                                            </div>
                                        ) : gifLoading ? (
                                            <div className="gif-loading">Chargement…</div>
                                        ) : (
                                            <div className="gif-grid">
                                                {gifs.map(gif => (
                                                    <img
                                                        key={gif.id}
                                                        src={gif.images.fixed_height_small?.url || gif.images.fixed_height?.url}
                                                        alt={gif.title}
                                                        className="gif-thumbnail"
                                                        onClick={() => sendGif(gif.images.fixed_height?.url || gif.images.original?.url)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <form className="chat-input-form" onSubmit={sendMessage}>
                                    {isRecording ? (
                                        <div className="audio-recording-ui">
                                            <span className="recording-dot"></span>
                                            <span>{t('chat.recording')}</span>
                                            <button type="button" className="btn-stop" onClick={stopRecording}>{t('chat.stop')}</button>
                                        </div>
                                    ) : audioBlob ? (
                                        <div className="audio-preview-ui">
                                            <audio src={window.URL.createObjectURL(audioBlob)} controls className="audio-preview-player" />
                                            <div className="audio-preview-actions">
                                                <button type="button" className="btn-send-audio" onClick={sendAudioMessage}>{t('chat.send')}</button>
                                                <button type="button" className="btn-discard" onClick={() => setAudioBlob(null)}>{t('chat.discard')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <button type="button" className="mic-btn" onClick={startRecording}>🎤</button>
                                            <button
                                                type="button"
                                                className={`gif-btn ${showGifPicker ? 'active' : ''}`}
                                                onClick={() => { setShowGifPicker(v => !v); if (!showGifPicker) fetchGifs(); }}
                                            >GIF</button>
                                            <input
                                                type="text"
                                                className="input-base chat-input"
                                                placeholder={t('chat.typeMessage')}
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                            />
                                            <button type="submit" className="btn-primary" disabled={!newMessage.trim()}>
                                                {t('chat.send')}
                                            </button>
                                        </>
                                    )}
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chat-state">
                            <span className="chat-icon">💬</span>
                            <h3>{t('chat.selectMatch')}</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Incoming Call Modal */}
            {receivingCall && !callAccepted && (
                <div className="incoming-call-modal">
                    <h3>{t('chat.incomingCall', { type: callType === 'video' ? t('chat.videoCall') : t('chat.audioCall') })}</h3>
                    <p>{callerName}</p>
                    <div className="call-actions">
                        <button className="accept-btn" onClick={answerCall}>{t('chat.accept')}</button>
                        <button className="decline-btn" onClick={() => {
                            setReceivingCall(false);
                            socketRef.current.emit('end_call', { to: caller });
                        }}>{t('chat.decline')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatApp;
