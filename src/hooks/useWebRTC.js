import { useCallback, useEffect, useRef } from 'react';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import { useStateWithCallback } from './useStateWithCallback';
import freeice from 'freeice'

export const LOCAL_VIDEO = 'LOCAL_VIDEO'

export const useWebRTC = (roomId) => {
    const [clients, updateClients] = useStateWithCallback([]);

    const addNewClient = (newClient, cb) => {
        if(!clients.includes(newClient)) {
            updateClients(list => [...list, newClient], cb);
        }
    };

    const peerConnections = useRef({});
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null
    });

    useEffect(() => {
        const handleNewPeer = async ({peerId, createOffer}) => {
            if(peerId in peerConnections.current) {
                return console.warn(`Already connected to peer ${peerId}`);
            }

            peerConnections.current[peerId] = new RTCPeerConnection({
                iceServers: freeice(),
            })

            peerConnections.current[peerId].onicecandidate = event => {
                if(event.candidate) {
                    socket.emit(ACTIONS.RELAY_ICE, {
                        peerId,
                        iceCandidate: event.candidate
                    });
                }
            }

            let tracksNumber = 0;
            peerConnections.current[peerId].ontrack = ({streams: [remoteStream]}) => {
                tracksNumber++;

                if(tracksNumber === 2) { //video & audio tracks receive
                    addNewClient(peerId, () => {
                        peerMediaElements.current[peerId].srcObject= remoteStream
                    })
                }
            }

            localMediaStream.current.getTracks().forEach(track => {
                peerConnections.current[peerId].addTrack(track, localMediaStream.current)
            })

            if(createOffer) {
                const offer = await peerConnections.current[peerId].createOffer();

                await peerConnections.current[peerId].setLocalDescription();

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerId,
                    sessionDescription: offer
                })
            }
        }

        socket.on(ACTIONS.ADD_PEER, handleNewPeer)
    }, []);

    useEffect(() => {
        const setRemoteMedia = async ({peerId, sessionDescription: remoteDescription}) => {
            await peerConnections.current[peerId].setRemoteDescription(
                new RTCSessionDescription(remoteDescription)
            );

            if(remoteDescription.type === 'offer') {
                const answer = await peerConnections.current[peerId].createAnswer();

                await peerConnections.current[peerId].setLocalDescription(answer);

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerId,
                    sessionDescription: answer
                });
            }
        };

        socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)
    }, []);

    useEffect(() => {
        socket.on(ACTIONS.REMOVE_PEER, ({peerId}) => {
            if(peerConnections.current[peerId]) {
                peerConnections.current[peerId].close();
            }

            delete peerConnections.current[peerId];
            delete peerMediaElements.current[peerId];

            updateClients(list => list.filter(c => c !== peerId));
        });
    }, []);

    useEffect(() => {
        socket.on(ACTIONS.ICE_CANDIDATE, ({peerId, iceCandidate}) => {
            peerConnections.current[peerId].addIceCandidate(
                new RTCIceCandidate(iceCandidate)
            );
        });
    }, []);

    useEffect(() => {
        const startCapture = async () => {
            localMediaStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });

            addNewClient(LOCAL_VIDEO, () => {
                const localVideoElement = peerMediaElements.current[LOCAL_VIDEO]

                if(localVideoElement) {
                    localVideoElement.volume = 0;
                    localVideoElement.srcObject = localMediaStream.current;
                }
            })
        };

        startCapture()
        .then(() => socket.emit(ACTIONS.JOIN, {room: roomId}))
        .catch(e => console.error('Error getting userMedia', e))

        return () => {
            localMediaStream.current.getTracks().forEach(track => track.stop());

            socket.emit(ACTIONS.LEAVE);
        }
    }, [roomId])

    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node
    }, [])

    return {clients, provideMediaRef};
}
