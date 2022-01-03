import { useEffect, useRef } from 'react';

export const useWebRTC = (roomId) => {
    const [clients, updateClient] = useStateWithCallback([]);

    const peerConnections = useRef({});
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({});

    useEffect(() => {

    }, [])
}
