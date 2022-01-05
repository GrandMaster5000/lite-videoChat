import { useParams } from 'react-router-dom';
import { LOCAL_VIDEO, useWebRTC } from '../../hooks/useWebRTC';

export default function Room() {
    const {id: roomId} = useParams();
    const {clients, provideMediaRef} = useWebRTC(roomId);
    
    console.log(clients);

    return (
        <div>
           {clients.map((clientId) => {
               return (
                   <div key={clientId}>
                        <audio 
                        ref={instance => {
                            provideMediaRef(clientId, instance)
                        }}
                        autoPlay
                        playsInline
                        muted={clientId === LOCAL_VIDEO}
                        />
                   </div>
               )
           })}
        </div>
    )
}